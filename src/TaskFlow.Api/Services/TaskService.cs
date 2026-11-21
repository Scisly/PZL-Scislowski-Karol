using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Domain;

namespace TaskFlow.Api.Services;

public interface ITaskService
{
    Task<IReadOnlyList<TaskDto>> ListAsync(Guid? projectId, WorkStatus? status, Guid? assignedUserId, CancellationToken ct);
    Task<TaskDto> GetAsync(Guid id, CancellationToken ct);
    Task<TaskDto> CreateAsync(TaskCreateRequest request, CancellationToken ct);
    Task<TaskDto> UpdateAsync(Guid id, TaskWriteRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public sealed class TaskService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock, ILogger<TaskService> logger) : ITaskService
{
    private IQueryable<TaskItem> Accessible => db.Tasks.Where(x => x.Project.Members.Any(m => m.UserId == currentUser.Id));
    private IQueryable<TaskDto> ProjectDto(IQueryable<TaskItem> query) => query.Select(x => new TaskDto(x.Id, x.ProjectId, x.Project.Name, x.Title, x.Description, x.Status, x.Priority, x.DueDate, x.AssignedUserId, db.Users.Where(u => u.Id == x.AssignedUserId).Select(u => u.DisplayName).FirstOrDefault(), x.CreatedAt, x.UpdatedAt));

    private async Task<Project> LoadProjectAsync(Guid id, CancellationToken ct)
    {
        var project = await db.Projects.Include(x => x.Members).SingleOrDefaultAsync(x => x.Id == id && x.Members.Any(m => m.UserId == currentUser.Id), ct) ?? throw ApiException.NotFound();
        DomainRules.EnsureActive(project.IsArchived);
        return project;
    }

    private async Task<TaskItem> LoadAsync(Guid id, CancellationToken ct)
    {
        var task = await Accessible.Include(x => x.Project).ThenInclude(x => x.Members).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiException.NotFound();
        DomainRules.EnsureActive(task.Project.IsArchived);
        return task;
    }

    public async Task<IReadOnlyList<TaskDto>> ListAsync(Guid? projectId, WorkStatus? status, Guid? assignedUserId, CancellationToken ct)
    {
        if (status.HasValue && !Enum.IsDefined(status.Value)) throw new ApiException(400, "validation_error", "Nieprawidłowy status zadania.");
        if (projectId.HasValue && !await db.Projects.AnyAsync(x => x.Id == projectId && x.Members.Any(m => m.UserId == currentUser.Id), ct)) throw ApiException.NotFound();
        var query = Accessible.AsNoTracking();
        if (projectId.HasValue) query = query.Where(x => x.ProjectId == projectId);
        if (status.HasValue) query = query.Where(x => x.Status == status);
        if (assignedUserId.HasValue) query = query.Where(x => x.AssignedUserId == assignedUserId);
        return await ProjectDto(query.OrderByDescending(x => x.CreatedAt)).ToListAsync(ct);
    }

    public async Task<TaskDto> GetAsync(Guid id, CancellationToken ct) => await ProjectDto(Accessible.AsNoTracking().Where(x => x.Id == id)).SingleOrDefaultAsync(ct) ?? throw ApiException.NotFound();

    public async Task<TaskDto> CreateAsync(TaskCreateRequest request, CancellationToken ct)
    {
        var project = await LoadProjectAsync(request.ProjectId, ct);
        DomainRules.ValidateTaskDeadline(request.DueDate, project.Deadline);
        DomainRules.ValidateAssignment(request.AssignedUserId, project.Members.Select(x => x.UserId));
        var task = new TaskItem { ProjectId = project.Id, Project = project, Title = request.Title.Trim(), Description = request.Description?.Trim(), Status = request.Status, Priority = request.Priority, DueDate = request.DueDate, AssignedUserId = request.AssignedUserId, CreatedAt = clock.GetUtcNow(), UpdatedAt = clock.GetUtcNow() };
        db.Tasks.Add(task);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Task {TaskId} created in project {ProjectId} by user {UserId}", task.Id, project.Id, currentUser.Id);
        return await GetAsync(task.Id, ct);
    }

    public async Task<TaskDto> UpdateAsync(Guid id, TaskWriteRequest request, CancellationToken ct)
    {
        var task = await LoadAsync(id, ct);
        DomainRules.ValidateTaskDeadline(request.DueDate, task.Project.Deadline);
        DomainRules.ValidateAssignment(request.AssignedUserId, task.Project.Members.Select(x => x.UserId));
        task.Title = request.Title.Trim(); task.Description = request.Description?.Trim(); task.Status = request.Status; task.Priority = request.Priority; task.DueDate = request.DueDate; task.AssignedUserId = request.AssignedUserId; task.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Task {TaskId} updated by user {UserId}", id, currentUser.Id);
        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        db.Tasks.Remove(await LoadAsync(id, ct));
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Task {TaskId} deleted by user {UserId}", id, currentUser.Id);
    }
}
