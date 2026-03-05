namespace Jcf.AnasStore.Api.Contracts.Users;

public sealed record CreateUserResponse(
    UserResponse User,
    string GeneratedPassword);
