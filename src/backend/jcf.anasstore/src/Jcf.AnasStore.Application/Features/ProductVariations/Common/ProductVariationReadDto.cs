namespace Jcf.AnasStore.Application.Features.ProductVariations.Common;

public sealed record ProductVariationReadDto(
    Guid Uid,
    Guid ProductUid,
    string ProductName,
    string Code,
    Guid ColorUid,
    string ColorName,
    Guid ItemSizeUid,
    string ItemSizeName,
    int StockQuantity,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
