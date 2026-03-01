using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Roles.Common;

namespace Jcf.AnasStore.Application.Features.Roles.GetRoleById;

public sealed record GetRoleByIdQuery(Guid Uid) : IQuery<RoleDto?>;
