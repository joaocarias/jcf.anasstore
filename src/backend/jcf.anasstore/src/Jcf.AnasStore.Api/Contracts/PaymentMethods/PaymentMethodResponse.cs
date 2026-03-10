namespace Jcf.AnasStore.Api.Contracts.PaymentMethods;

public sealed record PaymentMethodResponse(
    Guid Uid,
    string Name,
    string Description,
    decimal DiscountPercentage,
    int MaxInstallments,
    int DisplayOrder,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
