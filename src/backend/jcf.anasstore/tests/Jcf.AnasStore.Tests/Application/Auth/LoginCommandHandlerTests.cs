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
    }

    [Fact]
    public async Task Should_Return_Token_When_Credentials_Are_Valid()
    {
        var user = new AuthenticatedUser(1, "admin@anasstore.com", ["Admin"]);
        var handler = new LoginCommandHandler(new FakeIdentityService(user), new FakeTokenService());

        var result = await handler.HandleAsync(new LoginCommand(user.Email, "Admin@123"), CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal("fake-jwt-token", result.Token);
    }

    private sealed class FakeIdentityService(AuthenticatedUser? user) : IIdentityService
    {
        public Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken)
        {
            return Task.FromResult(user);
        }
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string GenerateToken(AuthenticatedUser user) => "fake-jwt-token";
    }
}
