using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TaskFlow.Api.Infrastructure;

internal sealed class SwaggerOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var metadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        var authorization = metadata.OfType<IAuthorizeData>().ToArray();
        if (authorization.Length > 0 && !metadata.OfType<IAllowAnonymous>().Any())
        {
            operation.Security = [new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(JwtBearerDefaults.AuthenticationScheme)] = []
            }];
            AddProblem(operation, context, "401", "Wymagane uwierzytelnienie");

            if (authorization.Any(rule => !string.IsNullOrEmpty(rule.Roles) || !string.IsNullOrEmpty(rule.Policy)))
                AddProblem(operation, context, "403", "Niewystarczające uprawnienia");
        }

        if (context.ApiDescription.HttpMethod is "POST" or "PUT" or "DELETE")
            AddProblem(operation, context, "400", "Nieprawidłowe żądanie");

        AddProblem(operation, context, "500", "Nieoczekiwany błąd serwera");
    }

    private static void AddProblem(OpenApiOperation operation, OperationFilterContext context, string status, string description)
    {
        operation.Responses ??= [];
        if (operation.Responses.ContainsKey(status)) return;

        operation.Responses.Add(status, new OpenApiResponse
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/problem+json"] = new()
                {
                    Schema = context.SchemaGenerator.GenerateSchema(typeof(ProblemDetails), context.SchemaRepository)
                }
            }
        });
    }
}

internal sealed class SwaggerReferenceFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument document, DocumentFilterContext context)
        => document.SetReferenceHostDocument();
}
