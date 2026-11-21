using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using TaskFlow.Api.Auth;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Api.Integrations;
using TaskFlow.Api.Services;
using TaskFlow.Domain;

var migrateOnly = args.Contains("--migrate", StringComparer.Ordinal);
var builder = WebApplication.CreateBuilder(args.Where(x => x != "--migrate").ToArray());
var configuration = builder.Configuration;
var jwtKey = configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Configure Jwt:Key with at least 32 bytes using environment variables or local user secrets.");
var connection = configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=taskflow;Username=taskflow";
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connection));
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequiredLength = 10;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.User.RequireUniqueEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.SignIn.RequireConfirmedEmail = false;
}).AddEntityFrameworkStores<AppDbContext>().AddClaimsPrincipalFactory<TaskFlowClaimsFactory>().AddDefaultTokenProviders();
var localHttp = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Test");
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "TaskFlow.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = localHttp ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.Events.OnRedirectToLogin = context => ApiProblems.WriteAsync(context.HttpContext, 401, "unauthorized");
    options.Events.OnRedirectToAccessDenied = context => ApiProblems.WriteAsync(context.HttpContext, 403, "forbidden");
});
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Smart";
    options.DefaultAuthenticateScheme = "Smart";
    options.DefaultChallengeScheme = "Smart";
    options.DefaultForbidScheme = "Smart";
}).AddPolicyScheme("Smart", "Cookie or JWT", options =>
{
    options.ForwardDefaultSelector = context => context.Request.Headers.Authorization.ToString().StartsWith("Bearer", StringComparison.OrdinalIgnoreCase)
        ? JwtBearerDefaults.AuthenticationScheme : IdentityConstants.ApplicationScheme;
}).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new()
    {
        ValidateIssuer = true,
        ValidIssuer = "TaskFlow",
        ValidateAudience = true,
        ValidAudience = "TaskFlow",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(20),
        NameClaimType = "sub",
        RoleClaimType = "role"
    };
    options.Events = new()
    {
        OnChallenge = context => { context.HandleResponse(); return ApiProblems.WriteAsync(context.HttpContext, 401, "unauthorized"); },
        OnForbidden = context => ApiProblems.WriteAsync(context.HttpContext, 403, "forbidden")
    };
});
builder.Services.AddAuthorization(options => options.AddPolicy("CanCreateProjects", policy => policy.RequireAuthenticatedUser().RequireRole("Student", "Admin")));
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "TaskFlow.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = localHttp ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DeadlineAdvisor>();
builder.Services.AddTransient<HolidayStubHandler>();
var holidayMode = configuration["HolidayApi:Mode"] ?? "Stub";
if (holidayMode is not ("Stub" or "Live")) throw new InvalidOperationException("HolidayApi:Mode must be Stub or Live.");
builder.Services.AddHttpClient<IHolidayClient, NagerHolidayClient>(http =>
{
    http.BaseAddress = new("https://nagerholidays.com/api/v4/");
    http.Timeout = TimeSpan.FromSeconds(5);
}).ConfigurePrimaryHttpMessageHandler(provider => holidayMode == "Stub" ? provider.GetRequiredService<HolidayStubHandler>() : new HttpClientHandler());
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problem = ApiProblems.Create(context.HttpContext, 400, "validation_error", "Popraw wskazane pola.");
        problem.Extensions["errors"] = context.ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key, x => x.Value!.Errors.Select(_ => "Pole jest wymagane lub ma nieprawidłową wartość.").ToArray());
        var result = new BadRequestObjectResult(problem);
        result.ContentTypes.Add("application/problem+json");
        return result;
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "TaskFlow API", Version = "v1", Description = "Demo: uzyskaj JWT przez POST /api/auth/token, następnie użyj Authorize. Cookies Reacta wymagają X-CSRF-TOKEN." });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("Bearer", document)] = [] });
});
var app = builder.Build();
if (migrateOnly)
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    await SeedData.InitializeAsync(app.Services);
    return;
}
app.UseExceptionHandler();
app.UseStatusCodePages(async context =>
{
    if (context.HttpContext.Request.Path.StartsWithSegments("/api"))
    {
        var status = context.HttpContext.Response.StatusCode;
        await ApiProblems.WriteAsync(context.HttpContext, status, status == 404 ? "not_found" : status == 400 ? "validation_error" : "request_failed");
    }
});
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Trace-Id"] = context.TraceIdentifier;
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    await next(context);
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CsrfMiddleware>();
if (configuration.GetValue<bool>("Demo:Enabled")) { app.UseSwagger(); app.UseSwaggerUI(); }
app.MapControllers();
app.MapGet("/api/compare/tasks", async (Guid? projectId, string? status, Guid? assignedUserId, ITaskService tasks, CancellationToken ct) =>
{
    WorkStatus? filter = null;
    if (status is not null)
    {
        if (!Enum.TryParse<WorkStatus>(status, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed)) throw new ApiException(400, "validation_error", "Nieprawidłowy status zadania.");
        filter = parsed;
    }
    return Results.Ok(await tasks.ListAsync(projectId, filter, assignedUserId, ct));
}).RequireAuthorization().WithTags("Comparison");
app.MapGet("/api/compare/tasks/{id:guid}", async (Guid id, ITaskService tasks, CancellationToken ct) => Results.Ok(await tasks.GetAsync(id, ct))).RequireAuthorization().WithTags("Comparison");
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/api/health/ready", async (AppDbContext db, CancellationToken ct) =>
{
    if (!await db.Database.CanConnectAsync(ct)) throw new ApiException(503, "database_unavailable", "Baza danych jest niedostępna.");
    return Results.Ok(new { status = "ready" });
}).AllowAnonymous();
app.Map("/api/{**path}", (HttpContext context) => Results.Problem(ApiProblems.Create(context, 404, "not_found"))).AllowAnonymous();
app.MapFallbackToFile("index.html");
await app.RunAsync();

public partial class Program;
