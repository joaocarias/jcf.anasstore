using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Security;

namespace Jcf.AnasStore.Application.Features.Auth.Login;

public sealed class LoginCommandHandler(
    IIdentityService identityService,
    ITokenService tokenService)
    : ICommandHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> HandleAsync(LoginCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || string.IsNullOrWhiteSpace(command.Password))
        {
            return LoginResult.Fail("E-mail and password are required.");
        }

        var user = await identityService.ValidateCredentialsAsync(command.Email, command.Password, cancellationToken);
        if (user is null)
        {
            return LoginResult.Fail("Invalid credentials.");
        }

        var token = tokenService.GenerateAccessToken(user);
        var refreshToken = tokenService.GenerateRefreshToken();
        await identityService.SaveRefreshTokenAsync(user.UserId, refreshToken, cancellationToken);

        return LoginResult.Ok(token, refreshToken);
    }
}
