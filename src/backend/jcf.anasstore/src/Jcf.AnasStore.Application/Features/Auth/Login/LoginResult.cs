namespace Jcf.AnasStore.Application.Features.Auth.Login;

public sealed record LoginResult(bool Success, string Token, string RefreshToken, string Message)
{
    public static LoginResult Fail(string message) => new(false, string.Empty, string.Empty, message);
    public static LoginResult Ok(string token, string refreshToken) => new(true, token, refreshToken, "Authenticated.");
}
