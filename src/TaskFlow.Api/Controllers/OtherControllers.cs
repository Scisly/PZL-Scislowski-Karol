using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Auth;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Integrations;

namespace TaskFlow.Api.Controllers;

[ApiController, Authorize, Route("api/deadline-advice")]
public sealed class DeadlineAdviceController(DeadlineAdvisor advisor) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery, Required] DateOnly? date, CancellationToken ct) => Ok(await advisor.GetAdviceAsync(date!.Value, ct));
}

[ApiController, Authorize(Roles = "Admin"), Route("api/admin/users")]
public sealed class AdminUsersController(AppDbContext db, AuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var accounts = await db.Users.AsNoTracking().OrderBy(x => x.DisplayName).ToListAsync(ct);
        var result = new List<UserDto>();
        foreach (var user in accounts) result.Add(await auth.ToDtoAsync(user));
        return Ok(result);
    }
}
