namespace Jcf.AnasStore.Application.Abstractions.Security;

public sealed record AuthenticatedUser(long UserId, string Email, IReadOnlyCollection<string> Roles);
