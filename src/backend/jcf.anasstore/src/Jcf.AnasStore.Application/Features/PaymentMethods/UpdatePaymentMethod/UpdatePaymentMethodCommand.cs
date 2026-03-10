using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.UpdatePaymentMethod;

public sealed record UpdatePaymentMethodCommand(
    Guid Uid,
    string Name,
    string Description,
    decimal DiscountPercentage,
    int MaxInstallments,
    int DisplayOrder,
    bool? IsActive,
    long? UserId) : ICommand<PaymentMethodReadDto?>;
