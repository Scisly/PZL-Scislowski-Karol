using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Domain;

namespace TaskFlow.Api.Services;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> ListAsync(CancellationToken ct);
    Task<ProjectDto> GetAsync(Guid id, CancellationToken ct);
    Task<ProjectDto> CreateAsync(ProjectWriteRequest request, CancellationToken ct);
    Task<ProjectDto> UpdateAsync(Guid id, ProjectWriteRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<ProjectDto> SetArchivedAsync(Guid id, bool archived, CancellationToken ct);
    Task<IReadOnlyList<MemberDto>> ListMembersAsync(Guid id, CancellationToken ct);
    Task<MemberDto> AddMemberAsync(Guid id, AddMemberRequest request, CancellationToken ct);
    Task RemoveMemberAsync(Guid id, Guid userId, CancellationToken ct);
}

public sealed class ProjectService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock, ILogger<ProjectService> logger) : IProjectService
{
    private IQueryable<Project> Accessible => db.Projects.Where(x => x.Members.Any(m => m.UserId == currentUser.Id));

    private static ProjectDto Map(Project project) => new(project.Id, project.Name, project.CourseName, project.Description, project.Deadline, project.IsArchived, project.OwnerId, project.CreatedAt, project.Members.Count, project.Tasks.Count, project.Tasks.Count(x => x.Status == WorkStatus.Done));

    private async Task<Project> LoadAsync(Guid id, bool requireOwner, bool requireActive, CancellationToken ct)
    {
        var project = await Accessible.Include(x => x.Members).Include(x => x.Tasks).AsSplitQuery().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiException.NotFound();
        if (requireOwner && project.OwnerId != currentUser.Id) throw ApiException.Forbidden();
        if (requireActive) DomainRules.EnsureActive(project.IsArchived);
        return project;
    }

    public async Task<IReadOnlyList<ProjectDto>> ListAsync(CancellationToken ct) => await Accessible.AsNoTracking().OrderByDescending(x => x.CreatedAt)
        .Select(x => new ProjectDto(x.Id, x.Name, x.CourseName, x.Description, x.Deadline, x.IsArchived, x.OwnerId, x.CreatedAt, x.Members.Count, x.Tasks.Count, x.Tasks.Count(t => t.Status == WorkStatus.Done))).ToListAsync(ct);

    public async Task<ProjectDto> GetAsync(Guid id, CancellationToken ct)
    {
        var project = await Accessible.AsNoTracking().Where(x => x.Id == id)
            .Select(x => new ProjectDto(x.Id, x.Name, x.CourseName, x.Description, x.Deadline, x.IsArchived, x.OwnerId, x.CreatedAt, x.Members.Count, x.Tasks.Count, x.Tasks.Count(t => t.Status == WorkStatus.Done))).SingleOrDefaultAsync(ct);
        return project ?? throw ApiException.NotFound();
    }

    public async Task<ProjectDto> CreateAsync(ProjectWriteRequest request, CancellationToken ct)
    {
        var project = new Project { Name = request.Name.Trim(), CourseName = request.CourseName.Trim(), Description = request.Description?.Trim(), Deadline = request.Deadline!.Value, OwnerId = currentUser.Id, CreatedAt = clock.GetUtcNow() };
        project.Members.Add(new() { ProjectId = project.Id, UserId = currentUser.Id });
        db.Projects.Add(project);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Project {ProjectId} created by user {UserId}", project.Id, currentUser.Id);
        return Map(project);
    }

    public async Task<ProjectDto> UpdateAsync(Guid id, ProjectWriteRequest request, CancellationToken ct)
    {
        var project = await LoadAsync(id, true, true, ct);
        DomainRules.ValidateProjectDeadline(request.Deadline!.Value, project.Tasks.Select(x => x.DueDate));
        project.Name = request.Name.Trim(); project.CourseName = request.CourseName.Trim(); project.Description = request.Description?.Trim(); project.Deadline = request.Deadline.Value;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Project {ProjectId} updated by user {UserId}", id, currentUser.Id);
        return Map(project);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        db.Projects.Remove(await LoadAsync(id, true, false, ct));
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Project {ProjectId} deleted by user {UserId}", id, currentUser.Id);
    }

    public async Task<ProjectDto> SetArchivedAsync(Guid id, bool archived, CancellationToken ct)
    {
        var project = await LoadAsync(id, true, archived, ct);
        project.IsArchived = archived;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Project {ProjectId} archive state changed to {Archived} by user {UserId}", id, archived, currentUser.Id);
        return Map(project);
    }

    public async Task<IReadOnlyList<MemberDto>> ListMembersAsync(Guid id, CancellationToken ct)
    {
        var project = await Accessible.AsNoTracking().Where(x => x.Id == id).Select(x => new { x.OwnerId }).SingleOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        return await (from membership in db.ProjectMembers.AsNoTracking()
                      join user in db.Users.AsNoTracking() on membership.UserId equals user.Id
                      where membership.ProjectId == id
                      orderby user.DisplayName
                      select new MemberDto(user.Id, user.DisplayName, user.Email!, user.Id == project.OwnerId)).ToListAsync(ct);
    }

    public async Task<MemberDto> AddMemberAsync(Guid id, AddMemberRequest request, CancellationToken ct)
    {
        var project = await LoadAsync(id, true, true, ct);
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, ct) ?? throw new ApiException(404, "user_not_found", "Nie znaleziono konta o podanym adresie e-mail.");
        if (project.Members.Any(x => x.UserId == user.Id)) throw new DomainException("duplicate_membership", "To konto już należy do projektu.");
        project.Members.Add(new() { ProjectId = id, UserId = user.Id });
        await db.SaveChangesAsync(ct);
        logger.LogInformation("User {MemberId} added to project {ProjectId} by user {UserId}", user.Id, id, currentUser.Id);
        return new(user.Id, user.DisplayName, user.Email!, false);
    }

    public async Task RemoveMemberAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var project = await LoadAsync(id, true, true, ct);
        DomainRules.ValidateMemberRemoval(userId, project.OwnerId, project.Tasks.Any(x => x.AssignedUserId == userId));
        var member = project.Members.SingleOrDefault(x => x.UserId == userId) ?? throw ApiException.NotFound();
        db.ProjectMembers.Remove(member);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("User {MemberId} removed from project {ProjectId} by user {UserId}", userId, id, currentUser.Id);
    }
}
