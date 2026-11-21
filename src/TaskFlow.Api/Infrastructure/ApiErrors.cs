using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TaskFlow.Domain;

namespace TaskFlow.Api.Infrastructure;

public sealed class ApiException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;
    public static ApiException NotFound() => new(404, "not_found", "Nie znaleziono zasobu.");
    public static ApiException Forbidden() => new(403, "forbidden", "Nie masz uprawnień do tej operacji.");
}

public static class ApiProblems
{
    public static ProblemDetails Create(HttpContext context, int status, string code, string? detail = null)
    {
        var problem = new ProblemDetails
        {
            Status = status,
            Title = status switch { 400 => "Nieprawidłowe dane", 401 => "Wymagane logowanie", 403 => "Brak uprawnień", 404 => "Nie znaleziono", 409 => "Konflikt reguł", 503 => "Usługa niedostępna", 504 => "Przekroczono czas oczekiwania", _ => "Błąd serwera" },
            Detail = detail,
            Instance = context.Request.Path,
            Type = $"https://httpstatuses.com/{status}"
        };
        problem.Extensions["errorCode"] = code;
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
        return problem;
    }

    public static async Task WriteAsync(HttpContext context, int status, string code, string? detail = null)
    {
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(Create(context, status, code, detail), options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json", cancellationToken: context.RequestAborted);
    }
}

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested)
        {
            context.Response.StatusCode = 499;
            logger.LogInformation("Request cancelled by client. TraceId {TraceId}", context.TraceIdentifier);
            return true;
        }
        var (status, code, detail) = exception switch
        {
            DomainException domain => (409, domain.Code, domain.Message),
            ApiException api => (api.StatusCode, api.Code, api.Message),
            BadHttpRequestException => (400, "validation_error", "Żądanie ma nieprawidłowy format."),
            DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } } => (409, "duplicate_resource", "Zasób już istnieje."),
            DbUpdateConcurrencyException => (409, "resource_changed", "Zasób został usunięty. Odśwież dane."),
            _ => (500, "internal_error", "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.")
        };
        // Exception messages can contain data or provider details. Log type, status and trace only.
        if (status >= 500) logger.LogError("Request failed: {ExceptionType} with {StatusCode}. TraceId {TraceId}", exception.GetType().Name, status, context.TraceIdentifier);
        else logger.LogWarning("Request rejected: {ErrorCode} with {StatusCode}. TraceId {TraceId}", code, status, context.TraceIdentifier);
        await ApiProblems.WriteAsync(context, status, code, detail);
        return true;
    }
}
