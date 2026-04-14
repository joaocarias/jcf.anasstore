namespace Jcf.AnasStore.Application.Abstractions.Notifications;

public interface IEmailSender
{
    Task SendAsync(EmailRequest request, CancellationToken cancellationToken);
}
