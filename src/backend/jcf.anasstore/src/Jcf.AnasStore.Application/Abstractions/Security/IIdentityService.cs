namespace Jcf.AnasStore.Application.Abstractions.Security;

public interface IIdentityService
{
    Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken);
    Task SaveRefreshTokenAsync(long userId, string refreshToken, CancellationToken cancellationToken);
    Task<AuthenticatedUser?> GetUserByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken);
    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken);
}
