using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Services;
using TaskFlow.Domain;

namespace TaskFlow.Api.Controllers;

[ApiController, Authorize, Route("api/tasks")]
public sealed class TasksController(ITaskService tasks, ICommentService comments) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? projectId, [FromQuery] WorkStatus? status, [FromQuery] Guid? assignedUserId, CancellationToken ct) => Ok(await tasks.ListAsync(projectId, status, assignedUserId, ct));
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await tasks.GetAsync(id, ct));
    [HttpPost]
    public async Task<IActionResult> Create(TaskCreateRequest request, CancellationToken ct)
    {
        var task = await tasks.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = task.Id }, task);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, TaskWriteRequest request, CancellationToken ct) => Ok(await tasks.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await tasks.DeleteAsync(id, ct); return NoContent(); }
    [HttpGet("{id:guid}/comments")]
    public async Task<IActionResult> Comments(Guid id, CancellationToken ct) => Ok(await comments.ListAsync(id, ct));
    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, CommentWriteRequest request, CancellationToken ct) => StatusCode(201, await comments.CreateAsync(id, request, ct));
}

[ApiController, Authorize, Route("api/comments")]
public sealed class CommentsController(ICommentService comments) : ControllerBase
{
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CommentWriteRequest request, CancellationToken ct) => Ok(await comments.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await comments.DeleteAsync(id, ct); return NoContent(); }
}
