using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Auth;
using TaskFlow.Api.Contracts;

namespace TaskFlow.Api.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(AuthService auth) : ControllerBase
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
    public async Task<IActionResult> Me() => Ok(await auth.GetCurrentUserAsync());
    [HttpPost("logout"), Authorize]
    public async Task<IActionResult> Logout() { await auth.LogoutAsync(); return NoContent(); }
    [HttpPost("token"), AllowAnonymous]
    public async Task<IActionResult> Token(LoginRequest request) => Ok(await auth.TokenAsync(request));
}
