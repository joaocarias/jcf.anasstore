namespace Jcf.AnasStore.Application.Features.Roles.Common;

public sealed record RoleDto(Guid Uid, string Name, bool IsActive, DateTime CreateAt);
