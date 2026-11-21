namespace TaskFlow.Domain;

public enum WorkStatus { Todo, InProgress, Done }
public enum TaskPriority { Low, Normal, High }

public sealed class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string CourseName { get; set; } = "";
    public string? Description { get; set; }
    public DateOnly Deadline { get; set; }
    public bool IsArchived { get; set; }
    public Guid OwnerId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<ProjectMember> Members { get; set; } = [];
    public List<TaskItem> Tasks { get; set; } = [];
}

public sealed class ProjectMember
{
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public Project Project { get; set; } = null!;
}

public sealed class TaskItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public WorkStatus Status { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Normal;
    public DateOnly? DueDate { get; set; }
    public Guid? AssignedUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<Comment> Comments { get; set; } = [];
}

public sealed class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
