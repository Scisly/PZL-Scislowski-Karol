using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Api.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace TaskFlow.IntegrationTests;

[CollectionDefinition("TaskFlow", DisableParallelization = true)]
public sealed class ApplicationCollection : ICollectionFixture<TaskFlowFactory>;

public sealed class TaskFlowFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static DateOnly ReferenceDate { get; } = DateOnly.FromDateTime(DateTime.UtcNow);
    private readonly PostgreSqlContainer database = new PostgreSqlBuilder("postgres:18")
        .WithDatabase("taskflow_test")
        .WithUsername("taskflow_test")
        .WithPassword(Guid.NewGuid().ToString("N"))
        .Build();

    public string DemoPassword { get; } = "Test!a9Z" + Guid.NewGuid().ToString("N");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = database.GetConnectionString(),
            ["Demo:Enabled"] = "true",
            ["Demo:Password"] = DemoPassword,
            ["Jwt:Key"] = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            ["HolidayApi:Mode"] = "Stub",
            ["HolidayApi:StubScenario"] = "Success"
        };
        foreach (var setting in settings)
            builder.UseSetting(setting.Key, setting.Value);
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(settings));
    }

    public async Task InitializeAsync()
    {
        await database.StartAsync();
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();
        await SeedData.InitializeAsync(scope.ServiceProvider);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        await database.DisposeAsync();
    }

    public HttpClient NewClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        BaseAddress = new Uri("https://localhost")
    });

    public async Task<ApiUser> RegisterAsync()
    {
        var client = NewClient();
        var email = $"student-{Guid.NewGuid():N}@example.test";
        var response = await ApiUser.SendAsync(client, HttpMethod.Post, "/api/auth/register", new
        {
            displayName = "Student testowy",
            email,
            password = DemoPassword
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ApiUser.ReadAsync(response);
        return new ApiUser(client, body.GetProperty("id").GetString()!, email);
    }
}

public sealed class ApiUser(HttpClient client, string id, string email) : IDisposable
{
    public HttpClient Client { get; } = client;
    public string Id { get; } = id;
    public string Email { get; } = email;

    public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object? body = null) =>
        SendAsync(Client, method, path, body);

    public static async Task<HttpResponseMessage> SendAsync(HttpClient client, HttpMethod method, string path, object? body = null)
    {
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/auth/csrf");
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        if (body is not null) request.Content = JsonContent.Create(body);
        return await client.SendAsync(request);
    }

    public static async Task<JsonElement> ReadAsync(HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(text);
        return document.RootElement.Clone();
    }

    public async Task<JsonElement> CreateProjectAsync()
    {
        var response = await SendAsync(HttpMethod.Post, "/api/projects", new
        {
            name = "Projekt integracyjny",
            courseName = "Programowanie zaawansowane",
            description = "Kontrolowane dane testowe",
            deadline = TaskFlowFactory.ReferenceDate.AddDays(30)
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await ReadAsync(response);
    }

    public async Task<JsonElement> CreateTaskAsync(string projectId, string? assignee = null, string status = "Todo")
    {
        var response = await SendAsync(HttpMethod.Post, "/api/tasks", new
        {
            projectId,
            title = "Zadanie testowe",
            description = "Opis",
            status,
            priority = "Normal",
            dueDate = TaskFlowFactory.ReferenceDate.AddDays(10),
            assignedUserId = assignee
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await ReadAsync(response);
    }

    public void Dispose() => Client.Dispose();
}
