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
    [ProducesResponseType<CsrfTokenDto>(200)]
    public IActionResult Csrf([FromServices] IAntiforgery antiforgery)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new CsrfTokenDto(antiforgery.GetAndStoreTokens(HttpContext).RequestToken));
    }
    [HttpPost("register"), AllowAnonymous]
    [ProducesResponseType<UserDto>(201)]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Register(RegisterRequest request) => StatusCode(201, await auth.RegisterAsync(request));
    [HttpPost("login"), AllowAnonymous]
    [ProducesResponseType<UserDto>(200)]
    [ProducesResponseType<ProblemDetails>(401, "application/problem+json")]
    public async Task<IActionResult> Login(LoginRequest request) => Ok(await auth.LoginAsync(request));
    [HttpGet("me"), Authorize]
    [ProducesResponseType<UserDto>(200)]
    public async Task<IActionResult> Me() => Ok(await auth.GetCurrentUserAsync());
    [HttpPost("logout"), Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout() { await auth.LogoutAsync(); return NoContent(); }
    [HttpPost("token"), AllowAnonymous]
    [ProducesResponseType<DemoTokenDto>(200)]
    [ProducesResponseType<ProblemDetails>(401, "application/problem+json")]
    public async Task<IActionResult> Token(LoginRequest request) => Ok(await auth.TokenAsync(request));
}
