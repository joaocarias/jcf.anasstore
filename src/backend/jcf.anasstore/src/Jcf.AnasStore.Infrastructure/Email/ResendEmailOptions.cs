namespace Jcf.AnasStore.Infrastructure.Email;

public sealed class ResendEmailOptions
{
    public const string SectionName = "Resend";

    public string? ApiToken { get; init; }

    public string? FromEmail { get; init; }

    public string? FromName { get; init; }
}
