using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain;

namespace TaskFlow.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in new[] { "Student", "Admin" })
        {
            if (!await roles.RoleExistsAsync(role)) Ensure(await roles.CreateAsync(new() { Id = Guid.NewGuid(), Name = role }));
        }
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        if (!configuration.GetValue<bool>("Demo:Enabled")) return;
        var password = configuration["Demo:Password"];
        if (string.IsNullOrWhiteSpace(password)) throw new InvalidOperationException("Demo:Password must be supplied when Demo:Enabled is true.");
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var owner = await EnsureUser("owner@taskflow.local", "Anna Kowalska", "Student");
        var member = await EnsureUser("member@taskflow.local", "Piotr Nowak", "Student");
        await EnsureUser("outsider@taskflow.local", "Maria Zielińska", "Student");
        await EnsureUser("admin@taskflow.local", "Administrator", "Admin");
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (await db.Projects.AnyAsync(cancellationToken)) return;
        var clock = scope.ServiceProvider.GetRequiredService<TimeProvider>();
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var project = new Project { Id = Guid.Parse("11111111-1111-4111-8111-111111111111"), Name = "Aplikacja biblioteczna", CourseName = "Programowanie zaawansowane", Description = "Wspólny projekt aplikacji do zarządzania biblioteką studencką.", Deadline = today.AddDays(30), OwnerId = owner.Id, CreatedAt = now };
        project.Members.AddRange([new() { ProjectId = project.Id, UserId = owner.Id }, new() { ProjectId = project.Id, UserId = member.Id }]);
        var task = new TaskItem { Id = Guid.Parse("22222222-2222-4222-8222-222222222222"), ProjectId = project.Id, Title = "Zaprojektować model danych", Description = "Encje książek, czytelników i wypożyczeń oraz relacje.", Status = WorkStatus.InProgress, Priority = TaskPriority.High, DueDate = today.AddDays(7), AssignedUserId = member.Id, CreatedAt = now, UpdatedAt = now };
        task.Comments.Add(new() { AuthorId = owner.Id, TaskId = task.Id, Content = "Zacznijmy od diagramu encji i wspólnie go omówmy.", CreatedAt = now, UpdatedAt = now });
        project.Tasks.Add(task);
        project.Tasks.Add(new() { ProjectId = project.Id, Title = "Przygotować widok listy książek", Status = WorkStatus.Todo, Priority = TaskPriority.Normal, DueDate = today.AddDays(14), CreatedAt = now.AddSeconds(1), UpdatedAt = now.AddSeconds(1) });
        project.Tasks.Add(new() { ProjectId = project.Id, Title = "Ustalić zakres projektu", Status = WorkStatus.Done, Priority = TaskPriority.Low, AssignedUserId = owner.Id, CreatedAt = now.AddSeconds(-1), UpdatedAt = now });
        db.Projects.Add(project);
        var archived = new Project
        {
            Id = Guid.Parse("33333333-3333-4333-8333-333333333333"),
            Name = "Analiza danych ankietowych",
            CourseName = "Bazy danych",
            Description = "Zakończony projekt pokazujący archiwum dostępne tylko do odczytu.",
            Deadline = today.AddDays(-7),
            OwnerId = owner.Id,
            IsArchived = true,
            CreatedAt = now.AddDays(-30)
        };
        archived.Members.AddRange([new() { ProjectId = archived.Id, UserId = owner.Id }, new() { ProjectId = archived.Id, UserId = member.Id }]);
        archived.Tasks.Add(new()
        {
            Id = Guid.Parse("44444444-4444-4444-8444-444444444444"),
            ProjectId = archived.Id,
            Title = "Opracować wyniki i wnioski",
            Status = WorkStatus.Done,
            Priority = TaskPriority.Normal,
            DueDate = archived.Deadline,
            AssignedUserId = owner.Id,
            CreatedAt = now.AddDays(-20),
            UpdatedAt = now.AddDays(-7)
        });
        db.Projects.Add(archived);
        await db.SaveChangesAsync(cancellationToken);

        async Task<ApplicationUser> EnsureUser(string email, string name, string role)
        {
            var user = await users.FindByEmailAsync(email);
            if (user is null)
            {
                user = new() { Id = Guid.NewGuid(), UserName = email, Email = email, DisplayName = name };
                Ensure(await users.CreateAsync(user, password));
            }
            if (!await users.IsInRoleAsync(user, role)) Ensure(await users.AddToRoleAsync(user, role));
            return user;
        }
    }

    private static void Ensure(IdentityResult result)
    {
        if (!result.Succeeded) throw new InvalidOperationException("Could not bootstrap demo account or role. Check configured password requirements.");
    }
}
