using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Roles.Common;

namespace Jcf.AnasStore.Application.Features.Roles.GetAllRoles;

public sealed record GetAllRolesQuery : IQuery<IReadOnlyList<RoleDto>>;
