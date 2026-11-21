using System.Text.Json;
using Xunit;

namespace TaskFlow.IntegrationTests;

[Collection("TaskFlow")]
public sealed class OpenApiContractTests(TaskFlowFactory factory)
{
    [Fact]
    public async Task SwaggerReportsActualTaskResponsesAndPerEndpointSecurity()
    {
        using var client = factory.NewClient();
        using var response = await client.GetAsync("/swagger/v1/swagger.json");
        response.EnsureSuccessStatusCode();
        var document = await ApiUser.ReadAsync(response);
        var paths = document.GetProperty("paths");

        var create = paths.GetProperty("/api/tasks").GetProperty("post");
        var createResponses = create.GetProperty("responses");
        Assert.False(createResponses.TryGetProperty("200", out _));
        Assert.Equal("#/components/schemas/TaskDto", createResponses.GetProperty("201")
            .GetProperty("content").GetProperty("application/json").GetProperty("schema").GetProperty("$ref").GetString());
        Assert.True(create.GetProperty("security")[0].TryGetProperty("Bearer", out _));
        Assert.True(createResponses.GetProperty("401").GetProperty("content").TryGetProperty("application/problem+json", out _));

        var deleteResponses = paths.GetProperty("/api/tasks/{id}").GetProperty("delete").GetProperty("responses");
        Assert.True(deleteResponses.TryGetProperty("204", out var noContent));
        Assert.False(noContent.TryGetProperty("content", out _));

        var compare = paths.GetProperty("/api/compare/tasks/{id}").GetProperty("get");
        Assert.Equal("#/components/schemas/TaskDto", compare.GetProperty("responses").GetProperty("200")
            .GetProperty("content").GetProperty("application/json").GetProperty("schema").GetProperty("$ref").GetString());

        var admin = paths.GetProperty("/api/admin/users").GetProperty("get");
        Assert.True(admin.GetProperty("responses").TryGetProperty("403", out _));

        var token = paths.GetProperty("/api/auth/token").GetProperty("post");
        Assert.True(IsAnonymous(document));
        Assert.True(IsAnonymous(token));
        Assert.True(IsAnonymous(paths.GetProperty("/api/health").GetProperty("get")));
    }

    private static bool IsAnonymous(JsonElement element) => !element.TryGetProperty("security", out var security) || security.GetArrayLength() == 0;
}
