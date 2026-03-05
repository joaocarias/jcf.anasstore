namespace Jcf.AnasStore.Api.Contracts.Users;

public sealed record CreateUserRequest(string Name, string Email, string RoleName, bool IsActive = true);
