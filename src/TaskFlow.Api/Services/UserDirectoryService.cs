using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Contracts;
using TaskFlow.Api.Data;

namespace TaskFlow.Api.Services;

public interface IUserDirectoryService
{
    Task<IReadOnlyList<UserDto>> ListAsync(CancellationToken cancellationToken);
}

public sealed class UserDirectoryService(AppDbContext db) : IUserDirectoryService
{
    public async Task<IReadOnlyList<UserDto>> ListAsync(CancellationToken cancellationToken)
    {
        var accounts = await db.Users.AsNoTracking().OrderBy(x => x.DisplayName)
            .Select(x => new { x.Id, x.DisplayName, x.Email }).ToListAsync(cancellationToken);
        var roleAssignments = await (from membership in db.UserRoles.AsNoTracking()
                                     join role in db.Roles.AsNoTracking() on membership.RoleId equals role.Id
                                     select new { membership.UserId, RoleName = role.Name! }).ToListAsync(cancellationToken);
        var rolesByUser = roleAssignments.ToLookup(x => x.UserId, x => x.RoleName);
        return accounts.Select(x => new UserDto(x.Id, x.DisplayName, x.Email!, rolesByUser[x.Id].Order(StringComparer.Ordinal).ToArray())).ToArray();
    }
}
