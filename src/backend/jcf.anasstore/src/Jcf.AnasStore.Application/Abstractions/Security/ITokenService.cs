namespace Jcf.AnasStore.Application.Abstractions.Security;

public interface ITokenService
{
    string GenerateToken(AuthenticatedUser user);
}
