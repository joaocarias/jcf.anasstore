namespace Jcf.AnasStore.Api.Contracts.PaymentMethods;

public sealed record UpdatePaymentMethodRequest(
    string Name,
    string Description,
    decimal DiscountPercentage,
    int MaxInstallments,
    int DisplayOrder,
    bool? IsActive);
