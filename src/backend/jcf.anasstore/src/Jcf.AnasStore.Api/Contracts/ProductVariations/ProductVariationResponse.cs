namespace Jcf.AnasStore.Api.Contracts.ProductVariations;

public sealed record ProductVariationResponse(
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
