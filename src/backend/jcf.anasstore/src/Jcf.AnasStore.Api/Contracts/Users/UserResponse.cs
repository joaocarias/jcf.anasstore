namespace Jcf.AnasStore.Api.Contracts.Users;

public sealed record UserResponse(
    Guid Uid,
    string Name,
    string Email,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt,
    IReadOnlyList<string> Roles);
