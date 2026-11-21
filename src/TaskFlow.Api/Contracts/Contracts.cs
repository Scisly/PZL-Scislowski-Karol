using System.ComponentModel.DataAnnotations;
using TaskFlow.Domain;

namespace TaskFlow.Api.Contracts;

public sealed class NotBlankAttribute : ValidationAttribute
{
    public override bool IsValid(object? value) => value is string text && !string.IsNullOrWhiteSpace(text);
    public override string FormatErrorMessage(string name) => $"Pole {name} nie może być puste.";
}

public sealed record UserDto(Guid Id, string DisplayName, string Email, string[] Roles);
public sealed record ProjectDto(Guid Id, string Name, string CourseName, string? Description, DateOnly Deadline, bool IsArchived, Guid OwnerId, DateTimeOffset CreatedAt, int MemberCount, int TaskCount, int CompletedTaskCount);
public sealed record MemberDto(Guid UserId, string DisplayName, string Email, bool IsOwner);
public sealed record TaskDto(Guid Id, Guid ProjectId, string ProjectName, string Title, string? Description, WorkStatus Status, TaskPriority Priority, DateOnly? DueDate, Guid? AssignedUserId, string? AssignedUserName, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record CommentDto(Guid Id, Guid TaskId, Guid AuthorId, string AuthorName, string Content, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record RegisterRequest([NotBlank, StringLength(100)] string DisplayName, [Required, EmailAddress, StringLength(256)] string Email, [Required, StringLength(128, MinimumLength = 10)] string Password);
public sealed record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
public sealed record ProjectWriteRequest([NotBlank, StringLength(200)] string Name, [NotBlank, StringLength(150)] string CourseName, [StringLength(4000)] string? Description, [Required] DateOnly? Deadline);
public sealed record AddMemberRequest([Required, EmailAddress] string Email);
public sealed record TaskCreateRequest([Required] Guid ProjectId, [NotBlank, StringLength(200)] string Title, [StringLength(4000)] string? Description, [EnumDataType(typeof(WorkStatus))] WorkStatus Status = WorkStatus.Todo, [EnumDataType(typeof(TaskPriority))] TaskPriority Priority = TaskPriority.Normal, DateOnly? DueDate = null, Guid? AssignedUserId = null);
public sealed record TaskWriteRequest([NotBlank, StringLength(200)] string Title, [StringLength(4000)] string? Description, [EnumDataType(typeof(WorkStatus))] WorkStatus Status = WorkStatus.Todo, [EnumDataType(typeof(TaskPriority))] TaskPriority Priority = TaskPriority.Normal, DateOnly? DueDate = null, Guid? AssignedUserId = null);
public sealed record CommentWriteRequest([NotBlank, StringLength(2000)] string Content);
