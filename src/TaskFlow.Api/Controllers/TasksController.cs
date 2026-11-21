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
    [ProducesResponseType<IReadOnlyList<TaskDto>>(200)]
    [ProducesResponseType<ProblemDetails>(400, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    public async Task<IActionResult> List([FromQuery] Guid? projectId, [FromQuery] WorkStatus? status, [FromQuery] Guid? assignedUserId, CancellationToken ct) => Ok(await tasks.ListAsync(projectId, status, assignedUserId, ct));
    [HttpGet("{id:guid}")]
    [ProducesResponseType<TaskDto>(200)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await tasks.GetAsync(id, ct));
    [HttpPost]
    [ProducesResponseType<TaskDto>(201)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Create(TaskCreateRequest request, CancellationToken ct)
    {
        var task = await tasks.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = task.Id }, task);
    }
    [HttpPut("{id:guid}")]
    [ProducesResponseType<TaskDto>(200)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Update(Guid id, TaskWriteRequest request, CancellationToken ct) => Ok(await tasks.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await tasks.DeleteAsync(id, ct); return NoContent(); }
    [HttpGet("{id:guid}/comments")]
    [ProducesResponseType<IReadOnlyList<CommentDto>>(200)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    public async Task<IActionResult> Comments(Guid id, CancellationToken ct) => Ok(await comments.ListAsync(id, ct));
    [HttpPost("{id:guid}/comments")]
    [ProducesResponseType<CommentDto>(201)]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> AddComment(Guid id, CommentWriteRequest request, CancellationToken ct) => StatusCode(201, await comments.CreateAsync(id, request, ct));
}

[ApiController, Authorize, Route("api/comments")]
public sealed class CommentsController(ICommentService comments) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [ProducesResponseType<CommentDto>(200)]
    [ProducesResponseType<ProblemDetails>(403, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Update(Guid id, CommentWriteRequest request, CancellationToken ct) => Ok(await comments.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ProblemDetails>(403, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(404, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(409, "application/problem+json")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await comments.DeleteAsync(id, ct); return NoContent(); }
}
