namespace Jcf.AnasStore.Application.Features.Auth.Login;

public sealed record LoginResult(bool Success, string Token, string Message)
{
    public static LoginResult Fail(string message) => new(false, string.Empty, message);
    public static LoginResult Ok(string token) => new(true, token, "Authenticated.");
}
