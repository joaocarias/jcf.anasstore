using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Roles.Common;

namespace Jcf.AnasStore.Application.Features.Roles.GetRoleById;

public sealed class GetRoleByIdQueryHandler(IRolesReadRepository rolesReadRepository)
    : IQueryHandler<GetRoleByIdQuery, RoleDto?>
{
    public Task<RoleDto?> HandleAsync(GetRoleByIdQuery query, CancellationToken cancellationToken)
    {
        return rolesReadRepository.GetByUidAsync(query.Uid, cancellationToken);
    }
}
