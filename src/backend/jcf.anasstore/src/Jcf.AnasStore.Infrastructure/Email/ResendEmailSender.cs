using Jcf.AnasStore.Application.Abstractions.Notifications;
using Microsoft.Extensions.Options;
using Resend;

namespace Jcf.AnasStore.Infrastructure.Email;

public sealed class ResendEmailSender(IResend resend, IOptions<ResendEmailOptions> options) : IEmailSender
{
    private readonly ResendEmailOptions _options = options.Value ?? new ResendEmailOptions();

    public async Task SendAsync(EmailRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.To))
        {
            throw new ArgumentException("Email destination is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            throw new ArgumentException("Email subject is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.HtmlBody))
        {
            throw new ArgumentException("Email html body is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            throw new InvalidOperationException("Resend:FromEmail must be configured.");
        }

        cancellationToken.ThrowIfCancellationRequested();

        var message = new EmailMessage
        {
            From = BuildFromAddress(),
            Subject = request.Subject,
            HtmlBody = request.HtmlBody
        };

        message.To.Add(request.To);
        await resend.EmailSendAsync(message);
    }

    private string BuildFromAddress()
    {
        if (string.IsNullOrWhiteSpace(_options.FromName))
        {
            return _options.FromEmail!;
        }

        return $"{_options.FromName} <{_options.FromEmail}>";
    }
}
