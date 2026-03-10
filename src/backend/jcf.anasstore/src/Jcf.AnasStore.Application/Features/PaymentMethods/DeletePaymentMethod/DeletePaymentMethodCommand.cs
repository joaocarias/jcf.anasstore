using Jcf.AnasStore.Application.Abstractions.Cqrs;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.DeletePaymentMethod;

public sealed record DeletePaymentMethodCommand(Guid Uid, long? UserId) : ICommand<bool>;
