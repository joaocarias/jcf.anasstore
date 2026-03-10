namespace Jcf.AnasStore.Api.Contracts.ProductVariations;

public sealed record CreateProductVariationRequest(
    Guid ProductUid,
    string? Code,
    Guid ColorUid,
    Guid ItemSizeUid,
    bool IsActive = true);
