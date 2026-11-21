using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Domain;

namespace TaskFlow.Api.Services;

public interface ICommentService
{
    Task<IReadOnlyList<CommentDto>> ListAsync(Guid taskId, CancellationToken ct);
    Task<CommentDto> CreateAsync(Guid taskId, CommentWriteRequest request, CancellationToken ct);
    Task<CommentDto> UpdateAsync(Guid id, CommentWriteRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public sealed class CommentService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock, ILogger<CommentService> logger) : ICommentService
{
    private IQueryable<CommentDto> Dto(IQueryable<Comment> query) => query.Select(x => new CommentDto(x.Id, x.TaskId, x.AuthorId, db.Users.Where(u => u.Id == x.AuthorId).Select(u => u.DisplayName).First(), x.Content, x.CreatedAt, x.UpdatedAt));

    private async Task<TaskItem> LoadTaskAsync(Guid id, bool active, CancellationToken ct)
    {
        var task = await db.Tasks.Include(x => x.Project).SingleOrDefaultAsync(x => x.Id == id && x.Project.Members.Any(m => m.UserId == currentUser.Id), ct) ?? throw ApiException.NotFound();
        if (active) DomainRules.EnsureActive(task.Project.IsArchived);
        return task;
    }

    public async Task<IReadOnlyList<CommentDto>> ListAsync(Guid taskId, CancellationToken ct)
    {
        await LoadTaskAsync(taskId, false, ct);
        return await Dto(db.Comments.AsNoTracking().Where(x => x.TaskId == taskId).OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)).ToListAsync(ct);
    }

    public async Task<CommentDto> CreateAsync(Guid taskId, CommentWriteRequest request, CancellationToken ct)
    {
        await LoadTaskAsync(taskId, true, ct);
        var comment = new Comment { TaskId = taskId, AuthorId = currentUser.Id, Content = request.Content.Trim(), CreatedAt = clock.GetUtcNow(), UpdatedAt = clock.GetUtcNow() };
        db.Comments.Add(comment);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Comment {CommentId} created by user {UserId}", comment.Id, currentUser.Id);
        return await Dto(db.Comments.AsNoTracking().Where(x => x.Id == comment.Id)).SingleAsync(ct);
    }

    private async Task<Comment> LoadAsync(Guid id, CancellationToken ct)
    {
        var comment = await db.Comments.Include(x => x.Task).ThenInclude(x => x.Project).SingleOrDefaultAsync(x => x.Id == id && x.Task.Project.Members.Any(m => m.UserId == currentUser.Id), ct) ?? throw ApiException.NotFound();
        DomainRules.EnsureActive(comment.Task.Project.IsArchived);
        return comment;
    }

    public async Task<CommentDto> UpdateAsync(Guid id, CommentWriteRequest request, CancellationToken ct)
    {
        var comment = await LoadAsync(id, ct);
        if (comment.AuthorId != currentUser.Id) throw ApiException.Forbidden();
        comment.Content = request.Content.Trim(); comment.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Comment {CommentId} updated by user {UserId}", id, currentUser.Id);
        return await Dto(db.Comments.AsNoTracking().Where(x => x.Id == id)).SingleAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var comment = await LoadAsync(id, ct);
        if (comment.AuthorId != currentUser.Id && comment.Task.Project.OwnerId != currentUser.Id) throw ApiException.Forbidden();
        db.Comments.Remove(comment);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Comment {CommentId} deleted by user {UserId}", id, currentUser.Id);
    }
}
