using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskFlow.Api.Integrations;
using Xunit;

namespace TaskFlow.IntegrationTests;

[Collection("TaskFlow")]
public sealed class ApiBehaviorTests(TaskFlowFactory factory)
{
    [Fact]
    public async Task AnonymousRequestsReturn401WithoutHtmlRedirect()
    {
        using var client = factory.NewClient();
        var response = await client.GetAsync("/api/projects");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/health/ready")).StatusCode);
    }

    [Fact]
    public async Task RegistrationAndLogoutRequireCsrfAndSessionSurvivesAnotherRequest()
    {
        using var client = factory.NewClient();
        var rejected = await client.PostAsJsonAsync("/api/auth/register", new
        {
            displayName = "Test", email = $"{Guid.NewGuid():N}@example.test", password = factory.DemoPassword
        });
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        using var user = await factory.RegisterAsync();
        Assert.Equal(HttpStatusCode.OK, (await user.Client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await user.Client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await user.SendAsync(HttpMethod.Post, "/api/auth/logout")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await user.Client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task InvalidBearerCannotBypassCsrfOnAnonymousRegistration()
    {
        using var client = factory.NewClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-valid-token");
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            displayName = "CSRF regression", email = $"{Guid.NewGuid():N}@example.test", password = factory.DemoPassword
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RealJwtWorksAndInvalidBearerDoesNotFallBackToValidCookie()
    {
        using var user = await factory.RegisterAsync();
        using var client = factory.NewClient();
        var issued = await client.PostAsJsonAsync("/api/auth/token", new { email = user.Email, password = factory.DemoPassword });
        Assert.Equal(HttpStatusCode.OK, issued.StatusCode);
        var token = (await ApiUser.ReadAsync(issued)).GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/projects")).StatusCode);
        var jwtUser = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal(user.Id, jwtUser.GetProperty("id").GetString());
        var createdWithoutCsrf = await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Projekt przez JWT", courseName = "API", deadline = TaskFlowFactory.ReferenceDate.AddDays(20)
        });
        Assert.Equal(HttpStatusCode.Created, createdWithoutCsrf.StatusCode);
        // Cookie is valid; a malformed Authorization header must not bypass JWT validation.
        user.Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid.jwt.token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await user.Client.GetAsync("/api/projects")).StatusCode);
    }

    [Fact]
    public async Task ProjectTaskCommentCrudAndFiltersPersistInPostgreSql()
    {
        using var owner = await factory.RegisterAsync();
        var project = await owner.CreateProjectAsync();
        var projectId = project.GetProperty("id").GetString()!;
        var task = await owner.CreateTaskAsync(projectId);
        var taskId = task.GetProperty("id").GetString()!;
        var list = await owner.Client.GetFromJsonAsync<JsonElement>($"/api/tasks?projectId={projectId}&status=Todo");
        Assert.Contains(list.EnumerateArray(), item => item.GetProperty("id").GetString() == taskId);
        var compare = await owner.Client.GetFromJsonAsync<JsonElement>($"/api/compare/tasks/{taskId}");
        Assert.Equal(taskId, compare.GetProperty("id").GetString());
        var updated = await owner.SendAsync(HttpMethod.Put, $"/api/tasks/{taskId}", new
        {
            title = "Po aktualizacji", description = "Opis", status = "Done", priority = "High", dueDate = (string?)null, assignedUserId = (string?)null
        });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("Done", (await ApiUser.ReadAsync(updated)).GetProperty("status").GetString());
        var comment = await owner.SendAsync(HttpMethod.Post, $"/api/tasks/{taskId}/comments", new { content = "Pierwszy komentarz" });
        Assert.Equal(HttpStatusCode.Created, comment.StatusCode);
        var commentId = (await ApiUser.ReadAsync(comment)).GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.OK, (await owner.SendAsync(HttpMethod.Put, $"/api/comments/{commentId}", new { content = "Poprawiony komentarz" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.SendAsync(HttpMethod.Delete, $"/api/comments/{commentId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.SendAsync(HttpMethod.Delete, $"/api/tasks/{taskId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.Client.GetAsync($"/api/tasks/{taskId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.SendAsync(HttpMethod.Delete, $"/api/projects/{projectId}")).StatusCode);
    }

    [Fact]
    public async Task OutsiderCannotReadListsDetailsOrComparisonAndStudentCannotReadAdmin()
    {
        using var owner = await factory.RegisterAsync();
        using var outsider = await factory.RegisterAsync();
        var projectId = (await owner.CreateProjectAsync()).GetProperty("id").GetString();
        var taskId = (await owner.CreateTaskAsync(projectId!)).GetProperty("id").GetString();
        foreach (var route in new[] { $"/api/projects/{projectId}", $"/api/tasks/{taskId}", $"/api/tasks?projectId={projectId}", $"/api/compare/tasks/{taskId}" })
            Assert.Equal(HttpStatusCode.NotFound, (await outsider.Client.GetAsync(route)).StatusCode);
        var projects = await outsider.Client.GetFromJsonAsync<JsonElement>("/api/projects");
        Assert.Empty(projects.EnumerateArray());
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.Client.GetAsync("/api/admin/users")).StatusCode);
    }

    [Fact]
    public async Task MemberCanCollaborateButCannotManageProjectOrRemoveAssignedMember()
    {
        using var owner = await factory.RegisterAsync();
        using var member = await factory.RegisterAsync();
        var projectId = (await owner.CreateProjectAsync()).GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.Created, (await owner.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/members", new { email = member.Email })).StatusCode);
        await member.CreateTaskAsync(projectId, member.Id);
        Assert.Equal(HttpStatusCode.Forbidden, (await member.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/archive")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.SendAsync(HttpMethod.Delete, $"/api/projects/{projectId}/members/{member.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.SendAsync(HttpMethod.Delete, $"/api/projects/{projectId}/members/{owner.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/members", new { email = member.Email })).StatusCode);
    }

    [Fact]
    public async Task AdministratorReadsAccountRolesButDoesNotBypassProjectMembership()
    {
        using var owner = await factory.RegisterAsync();
        var projectId = (await owner.CreateProjectAsync()).GetProperty("id").GetString();
        using var admin = factory.NewClient();
        var login = await ApiUser.SendAsync(admin, HttpMethod.Post, "/api/auth/login", new
        {
            email = "admin@taskflow.local", password = factory.DemoPassword
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var directory = await admin.GetFromJsonAsync<JsonElement>("/api/admin/users");
        var adminRow = directory.EnumerateArray().Single(item => item.GetProperty("email").GetString() == "admin@taskflow.local");
        Assert.Contains(adminRow.GetProperty("roles").EnumerateArray(), role => role.GetString() == "Admin");
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/projects/{projectId}")).StatusCode);
    }

    [Fact]
    public async Task CommentEditingBelongsToAuthorAndOwnerMayModerateDeletion()
    {
        using var owner = await factory.RegisterAsync();
        using var member = await factory.RegisterAsync();
        var projectId = (await owner.CreateProjectAsync()).GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.Created, (await owner.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/members", new { email = member.Email })).StatusCode);
        var taskId = (await owner.CreateTaskAsync(projectId)).GetProperty("id").GetString();
        var memberComment = await member.SendAsync(HttpMethod.Post, $"/api/tasks/{taskId}/comments", new { content = "Komentarz członka" });
        var memberCommentId = (await ApiUser.ReadAsync(memberComment)).GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.SendAsync(HttpMethod.Put, $"/api/comments/{memberCommentId}", new { content = "Podmieniona treść" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.SendAsync(HttpMethod.Delete, $"/api/comments/{memberCommentId}")).StatusCode);
        var ownerComment = await owner.SendAsync(HttpMethod.Post, $"/api/tasks/{taskId}/comments", new { content = "Komentarz właściciela" });
        var ownerCommentId = (await ApiUser.ReadAsync(ownerComment)).GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.Forbidden, (await member.SendAsync(HttpMethod.Delete, $"/api/comments/{ownerCommentId}")).StatusCode);
    }

    [Fact]
    public async Task InvalidRequestAndMissingResourceReturnProblemDetails()
    {
        using var owner = await factory.RegisterAsync();
        var invalid = await owner.SendAsync(HttpMethod.Post, "/api/projects", new { name = "", courseName = "", deadline = "invalid" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var missing = await owner.Client.GetAsync($"/api/tasks/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        foreach (var response in new[] { invalid, missing })
        {
            var problem = await ApiUser.ReadAsync(response);
            Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("traceId").GetString()));
            Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("errorCode").GetString()));
            Assert.Equal(response.Headers.GetValues("X-Trace-Id").Single(), problem.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task DeadlineAndArchivedProjectRulesReturn409()
    {
        using var owner = await factory.RegisterAsync();
        var projectId = (await owner.CreateProjectAsync()).GetProperty("id").GetString()!;
        var taskId = (await owner.CreateTaskAsync(projectId)).GetProperty("id").GetString();
        var late = await owner.SendAsync(HttpMethod.Post, "/api/tasks", new
        {
            projectId, title = "Za późno", status = "Todo", priority = "Normal", dueDate = TaskFlowFactory.ReferenceDate.AddDays(31)
        });
        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);
        var shorten = await owner.SendAsync(HttpMethod.Put, $"/api/projects/{projectId}", new
        {
            name = "Skrócony", courseName = "Test", deadline = TaskFlowFactory.ReferenceDate.AddDays(1)
        });
        Assert.Equal(HttpStatusCode.Conflict, shorten.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/archive")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.SendAsync(HttpMethod.Post, $"/api/tasks/{taskId}/comments", new { content = "Archiwum" })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.SendAsync(HttpMethod.Delete, $"/api/tasks/{taskId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.SendAsync(HttpMethod.Post, $"/api/projects/{projectId}/restore")).StatusCode);
    }

    [Fact]
    public async Task UnexpectedExceptionIsSanitizedAndContainsTraceId()
    {
        using var failingApp = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IHolidayClient>();
            services.AddSingleton<IHolidayClient, ExplodingHolidayClient>();
        }));
        using var client = failingApp.CreateClient(new() { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
        var login = await ApiUser.SendAsync(client, HttpMethod.Post, "/api/auth/login", new { email = "owner@taskflow.local", password = factory.DemoPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var response = await client.GetAsync("/api/deadline-advice?date=2027-02-10");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("PRIVATE_INTERNAL_DETAIL", body, StringComparison.Ordinal);
        Assert.Contains("traceId", body, StringComparison.Ordinal);
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class ExplodingHolidayClient : IHolidayClient
    {
        public Task<IReadOnlyList<PublicHoliday>> GetPublicHolidaysAsync(int year, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("PRIVATE_INTERNAL_DETAIL");
    }
}
