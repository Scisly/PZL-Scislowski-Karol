using System.Security.Claims;
using TaskFlow.Api.Infrastructure;

namespace TaskFlow.Api.Services;

public interface ICurrentUser { Guid Id { get; } }

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue("sub"), out var id)
        ? id : throw new ApiException(401, "unauthorized", "Wymagane logowanie.");
}
