using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Auth;

public sealed class TaskFlowClaimsFactory(UserManager<ApplicationUser> users, RoleManager<IdentityRole<Guid>> roles, IOptions<IdentityOptions> options) : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole<Guid>>(users, roles, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(ApplicationUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        identity.AddClaim(new("sub", user.Id.ToString()));
        foreach (var role in await UserManager.GetRolesAsync(user)) identity.AddClaim(new("role", role));
        return identity;
    }
}

public sealed class AuthService(UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, IConfiguration configuration, TimeProvider clock, ILogger<AuthService> logger, ICurrentUser currentUser)
{
    private async Task<UserDto> ToDtoAsync(ApplicationUser user) => new(user.Id, user.DisplayName, user.Email!, (await users.GetRolesAsync(user)).ToArray());

    public async Task<UserDto> GetCurrentUserAsync()
    {
        var user = await users.FindByIdAsync(currentUser.Id.ToString())
            ?? throw new ApiException(401, "unauthorized", "Wymagane logowanie.");
        return await ToDtoAsync(user);
    }

    public Task LogoutAsync() => signIn.SignOutAsync();

    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = email, Email = email, DisplayName = request.DisplayName.Trim() };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(x => x.Code is "DuplicateEmail" or "DuplicateUserName")) throw new ApiException(409, "email_taken", "Konto o podanym adresie już istnieje.");
            throw new ApiException(400, "password_requirements", "Hasło wymaga minimum 10 znaków, małej i wielkiej litery, cyfry oraz znaku specjalnego.");
        }
        var roleResult = await users.AddToRoleAsync(user, "Student");
        if (!roleResult.Succeeded) throw new InvalidOperationException("Could not assign registration role.");
        await signIn.SignInAsync(user, isPersistent: false);
        logger.LogInformation("User {UserId} registered", user.Id);
        return await ToDtoAsync(user);
    }

    public async Task<ApplicationUser> CheckCredentialsAsync(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null || !(await signIn.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true)).Succeeded)
            throw new ApiException(401, "invalid_credentials", "Nieprawidłowy e-mail lub hasło, albo konto jest chwilowo zablokowane.");
        return user;
    }

    public async Task<UserDto> LoginAsync(LoginRequest request)
    {
        var user = await CheckCredentialsAsync(request);
        await signIn.SignInAsync(user, isPersistent: false);
        logger.LogInformation("User {UserId} signed in", user.Id);
        return await ToDtoAsync(user);
    }

    public async Task<object> TokenAsync(LoginRequest request)
    {
        if (!configuration.GetValue<bool>("Demo:Enabled")) throw ApiException.NotFound();
        var user = await CheckCredentialsAsync(request);
        var expires = clock.GetUtcNow().AddMinutes(15);
        var claims = new List<Claim> { new("sub", user.Id.ToString()), new("jti", Guid.NewGuid().ToString()) };
        claims.AddRange((await users.GetRolesAsync(user)).Select(x => new Claim("role", x)));
        var token = new JwtSecurityToken(issuer: "TaskFlow", audience: "TaskFlow", claims: claims, notBefore: clock.GetUtcNow().UtcDateTime, expires: expires.UtcDateTime, signingCredentials: new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
        logger.LogInformation("Demo token issued to user {UserId}", user.Id);
        return new { accessToken = new JwtSecurityTokenHandler().WriteToken(token), expiresAt = expires };
    }
}

public sealed class CsrfMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAntiforgery antiforgery)
    {
        var unsafeMethod = !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) && !HttpMethods.IsOptions(context.Request.Method) && !HttpMethods.IsTrace(context.Request.Method);
        var tokenEndpoint = context.Request.Path.Equals("/api/auth/token", StringComparison.OrdinalIgnoreCase);
        var bearer = context.User.Identity?.IsAuthenticated == true && context.Request.Headers.Authorization.ToString().StartsWith("Bearer", StringComparison.OrdinalIgnoreCase);
        if (unsafeMethod && context.Request.Path.StartsWithSegments("/api") && !tokenEndpoint && !bearer)
        {
            try { await antiforgery.ValidateRequestAsync(context); }
            catch (AntiforgeryValidationException)
            {
                await ApiProblems.WriteAsync(context, 400, "csrf_invalid", "Sesja formularza wygasła. Odśwież stronę i spróbuj ponownie.");
                return;
            }
        }
        await next(context);
    }
}
