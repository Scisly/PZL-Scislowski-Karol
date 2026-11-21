using System.Diagnostics;

namespace TaskFlow.Api.Infrastructure;

public static class RequestTrace
{
    private static readonly object TraceKey = new();

    public static string GetId(HttpContext context)
    {
        if (context.Items.TryGetValue(TraceKey, out var traceId)) return (string)traceId!;
        var id = Activity.Current?.Id ?? context.TraceIdentifier;
        context.Items[TraceKey] = id;
        return id;
    }
}

public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = RequestTrace.GetId(context);
        using var scope = logger.BeginScope(new Dictionary<string, object> { ["TraceId"] = traceId });
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Trace-Id"] = traceId;
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            return Task.CompletedTask;
        });
        var startedAt = Stopwatch.GetTimestamp();
        await next(context);
        logger.LogInformation("HTTP {Method} {Path} returned {StatusCode} in {ElapsedMilliseconds} ms", context.Request.Method, context.Request.Path.Value, context.Response.StatusCode, Math.Round(Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds, 2));
    }
}
