using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Auth;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;

namespace TaskFlow.Api.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(AuthService auth, UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn) : ControllerBase
{
    [HttpGet("csrf"), AllowAnonymous]
    public IActionResult Csrf([FromServices] IAntiforgery antiforgery)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }
    [HttpPost("register"), AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request) => StatusCode(201, await auth.RegisterAsync(request));
    [HttpPost("login"), AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request) => Ok(await auth.LoginAsync(request));
    [HttpGet("me"), Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await users.FindByIdAsync(User.FindFirst("sub")?.Value ?? "") ?? throw new ApiException(401, "unauthorized", "Wymagane logowanie.");
        return Ok(await auth.ToDtoAsync(user));
    }
    [HttpPost("logout"), Authorize]
    public async Task<IActionResult> Logout() { await signIn.SignOutAsync(); return NoContent(); }
    [HttpPost("token"), AllowAnonymous]
    public async Task<IActionResult> Token(LoginRequest request) => Ok(await auth.TokenAsync(request));
}
