using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Roles.Common;

namespace Jcf.AnasStore.Application.Features.Roles.GetAllRoles;

public sealed class GetAllRolesQueryHandler(IRolesReadRepository rolesReadRepository)
    : IQueryHandler<GetAllRolesQuery, IReadOnlyList<RoleDto>>
{
    public Task<IReadOnlyList<RoleDto>> HandleAsync(GetAllRolesQuery query, CancellationToken cancellationToken)
    {
        return rolesReadRepository.GetAllAsync(cancellationToken);
    }
}
