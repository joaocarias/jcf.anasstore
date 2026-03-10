using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.CreatePaymentMethod;

public sealed record CreatePaymentMethodCommand(
    string Name,
    string Description,
    decimal DiscountPercentage,
    int MaxInstallments,
    int DisplayOrder,
    bool IsActive,
    long? UserId) : ICommand<PaymentMethodReadDto>;
