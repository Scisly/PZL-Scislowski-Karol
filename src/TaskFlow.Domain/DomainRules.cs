namespace TaskFlow.Domain;

public sealed class DomainException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public static class DomainRules
{
    public static void EnsureActive(bool archived)
    {
        if (archived) throw new DomainException("project_archived", "Archiwalny projekt jest tylko do odczytu.");
    }
    public static void ValidateTaskDeadline(DateOnly? taskDeadline, DateOnly projectDeadline)
    {
        if (taskDeadline > projectDeadline) throw new DomainException("task_deadline_exceeds_project", "Termin zadania przekracza termin projektu.");
    }
    public static void ValidateProjectDeadline(DateOnly deadline, IEnumerable<DateOnly?> taskDeadlines)
    {
        if (taskDeadlines.Any(x => x > deadline)) throw new DomainException("project_deadline_conflict", "Istnieją zadania z terminem późniejszym niż nowy termin projektu.");
    }
    public static void ValidateAssignment(Guid? assignedUserId, IEnumerable<Guid> members)
    {
        if (assignedUserId.HasValue && !members.Contains(assignedUserId.Value)) throw new DomainException("assignee_not_member", "Zadanie można przypisać tylko członkowi projektu.");
    }
    public static void ValidateMemberRemoval(Guid userId, Guid ownerId, bool hasAssignments)
    {
        if (userId == ownerId) throw new DomainException("owner_cannot_be_removed", "Nie można usunąć właściciela projektu.");
        if (hasAssignments) throw new DomainException("member_has_assignments", "Najpierw usuń przypisania zadań tego członka.");
    }
}
