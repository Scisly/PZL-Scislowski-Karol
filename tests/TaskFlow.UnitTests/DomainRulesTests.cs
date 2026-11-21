using TaskFlow.Domain;
using Xunit;

namespace TaskFlow.UnitTests;

public sealed class DomainRulesTests
{
    [Fact]
    public void EqualTaskAndProjectDeadlineIsAllowed() => DomainRules.ValidateTaskDeadline(new(2026, 12, 1), new(2026, 12, 1));

    [Fact]
    public void TaskCannotEndAfterProject() => Assert.Equal("task_deadline_exceeds_project", Assert.Throws<DomainException>(() => DomainRules.ValidateTaskDeadline(new(2026, 12, 2), new(2026, 12, 1))).Code);

    [Fact]
    public void ProjectCannotBeShortenedBeforeExistingTask() => Assert.Equal("project_deadline_conflict", Assert.Throws<DomainException>(() => DomainRules.ValidateProjectDeadline(new(2026, 12, 1), [new(2026, 12, 2)])).Code);

    [Fact]
    public void OwnerCannotBeRemoved()
    {
        var owner = Guid.NewGuid();
        Assert.Equal("owner_cannot_be_removed", Assert.Throws<DomainException>(() => DomainRules.ValidateMemberRemoval(owner, owner, false)).Code);
    }

    [Fact]
    public void AssignedMemberCannotBeRemoved() => Assert.Equal("member_has_assignments", Assert.Throws<DomainException>(() => DomainRules.ValidateMemberRemoval(Guid.NewGuid(), Guid.NewGuid(), true)).Code);

    [Fact]
    public void OutsiderCannotBeAssigned() => Assert.Equal("assignee_not_member", Assert.Throws<DomainException>(() => DomainRules.ValidateAssignment(Guid.NewGuid(), [Guid.NewGuid()])).Code);

    [Fact]
    public void ArchivedProjectIsReadOnly() => Assert.Equal("project_archived", Assert.Throws<DomainException>(() => DomainRules.EnsureActive(true)).Code);

    [Fact]
    public void OptionalTaskDeadlineDoesNotRestrictProject() => DomainRules.ValidateTaskDeadline(null, new(2026, 12, 1));

    [Fact]
    public void ProjectDeadlineCanEqualLatestTaskAndIgnoreUnscheduledTasks() => DomainRules.ValidateProjectDeadline(new(2026, 12, 1), [null, new(2026, 12, 1)]);

    [Fact]
    public void MemberAssignmentAndUnassignedTasksAreAllowed()
    {
        var member = Guid.NewGuid();
        DomainRules.ValidateAssignment(member, [member]);
        DomainRules.ValidateAssignment(null, []);
    }

    [Fact]
    public void OrdinaryUnassignedMemberCanBeRemoved() => DomainRules.ValidateMemberRemoval(Guid.NewGuid(), Guid.NewGuid(), false);

    [Fact]
    public void ActiveProjectAllowsChanges() => DomainRules.EnsureActive(false);
}
