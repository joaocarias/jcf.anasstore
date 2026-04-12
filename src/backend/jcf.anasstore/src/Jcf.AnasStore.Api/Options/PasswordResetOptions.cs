namespace Jcf.AnasStore.Api.Options;

public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    public string? BaseUrl { get; init; }

    public string Path { get; init; } = "/reset-password";
}
