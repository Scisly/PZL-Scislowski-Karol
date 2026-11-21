using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Integrations;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController, Authorize, Route("api/deadline-advice")]
public sealed class DeadlineAdviceController(DeadlineAdvisor advisor) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery, Required] DateOnly? date, CancellationToken ct) => Ok(await advisor.GetAdviceAsync(date!.Value, ct));
}

[ApiController, Authorize(Roles = "Admin"), Route("api/admin/users")]
public sealed class AdminUsersController(IUserDirectoryService users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await users.ListAsync(ct));
}
