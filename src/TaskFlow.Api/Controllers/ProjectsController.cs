using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController, Authorize, Route("api/projects")]
public sealed class ProjectsController(IProjectService projects) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await projects.ListAsync(ct));
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await projects.GetAsync(id, ct));
    [HttpPost, Authorize(Policy = "CanCreateProjects")]
    public async Task<IActionResult> Create(ProjectWriteRequest request, CancellationToken ct)
    {
        var project = await projects.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = project.Id }, project);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ProjectWriteRequest request, CancellationToken ct) => Ok(await projects.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await projects.DeleteAsync(id, ct); return NoContent(); }
    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct) => Ok(await projects.SetArchivedAsync(id, true, ct));
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken ct) => Ok(await projects.SetArchivedAsync(id, false, ct));
    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> Members(Guid id, CancellationToken ct) => Ok(await projects.ListMembersAsync(id, ct));
    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, AddMemberRequest request, CancellationToken ct) => StatusCode(201, await projects.AddMemberAsync(id, request, ct));
    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId, CancellationToken ct) { await projects.RemoveMemberAsync(id, userId, ct); return NoContent(); }
}
