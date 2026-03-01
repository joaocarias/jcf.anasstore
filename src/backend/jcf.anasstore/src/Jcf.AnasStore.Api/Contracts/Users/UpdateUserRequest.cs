namespace Jcf.AnasStore.Api.Contracts.Users;

public sealed record UpdateUserRequest(string? Name, string? Email, string? Password, string? RoleName, bool? IsActive);
