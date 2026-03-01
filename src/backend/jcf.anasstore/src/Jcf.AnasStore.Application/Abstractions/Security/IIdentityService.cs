namespace Jcf.AnasStore.Application.Abstractions.Security;

public interface IIdentityService
{
    Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken);
}
