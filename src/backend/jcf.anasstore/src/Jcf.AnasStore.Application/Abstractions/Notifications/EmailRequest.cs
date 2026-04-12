namespace Jcf.AnasStore.Application.Abstractions.Notifications;

public sealed record EmailRequest(string To, string Subject, string HtmlBody);
