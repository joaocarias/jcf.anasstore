namespace Jcf.AnasStore.Application.Features.PaymentMethods.Common;

public sealed record PaymentMethodReadDto(
    Guid Uid,
    string Name,
    string Description,
    decimal DiscountPercentage,
    int MaxInstallments,
    int DisplayOrder,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
