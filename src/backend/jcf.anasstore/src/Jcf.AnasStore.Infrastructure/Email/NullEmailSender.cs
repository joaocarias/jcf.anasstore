using Jcf.AnasStore.Application.Abstractions.Notifications;

namespace Jcf.AnasStore.Infrastructure.Email;

/// <summary>
/// Null email sender for development when Resend API token is not configured.
/// Logs email attempts instead of sending actual emails.
/// </summary>
public sealed class NullEmailSender : IEmailSender
{
    public Task SendAsync(EmailRequest request, CancellationToken cancellationToken)
    {
        // In development, just log and return without sending
        // You could add logging here if needed
        return Task.CompletedTask;
    }
}
