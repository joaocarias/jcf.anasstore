using Jcf.AnasStore.Application.Features.Roles.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IRolesReadRepository
{
    Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<RoleDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);
}
