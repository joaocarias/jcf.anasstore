namespace Jcf.AnasStore.Application.Abstractions.Security;

public interface ITokenService
{
    string GenerateAccessToken(AuthenticatedUser user);
    string GenerateRefreshToken();
}
