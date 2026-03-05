using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Features.Auth.Login;

namespace Jcf.AnasStore.Tests.Application.Auth;

public sealed class LoginCommandHandlerTests
{
    [Fact]
    public async Task Should_Return_Fail_When_Credentials_Are_Invalid()
    {
        var handler = new LoginCommandHandler(new FakeIdentityService(null), new FakeTokenService());

        var result = await handler.HandleAsync(new LoginCommand("invalid@anasstore.com", "123456"), CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal(string.Empty, result.Token);
        Assert.Equal(string.Empty, result.RefreshToken);
    }

    [Fact]
    public async Task Should_Return_Token_When_Credentials_Are_Valid()
    {
        var user = new AuthenticatedUser(1, "admin@anasstore.com", ["Admin"]);
        var handler = new LoginCommandHandler(new FakeIdentityService(user), new FakeTokenService());

        var result = await handler.HandleAsync(new LoginCommand(user.Email, "Admin@123"), CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal("fake-jwt-token", result.Token);
        Assert.Equal("fake-refresh-token", result.RefreshToken);
    }

    private sealed class FakeIdentityService(AuthenticatedUser? user) : IIdentityService
    {
        public Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken)
        {
            return Task.FromResult(user);
        }

        public Task SaveRefreshTokenAsync(long userId, string refreshToken, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public Task<AuthenticatedUser?> GetUserByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            return Task.FromResult<AuthenticatedUser?>(null);
        }

        public Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string GenerateAccessToken(AuthenticatedUser user) => "fake-jwt-token";
        public string GenerateRefreshToken() => "fake-refresh-token";
    }
}
