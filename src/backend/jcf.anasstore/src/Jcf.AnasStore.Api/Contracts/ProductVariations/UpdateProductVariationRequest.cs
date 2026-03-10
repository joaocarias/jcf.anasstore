namespace Jcf.AnasStore.Api.Contracts.ProductVariations;

public sealed record UpdateProductVariationRequest(
    Guid ProductUid,
    string? Code,
    Guid ColorUid,
    Guid ItemSizeUid,
    bool? IsActive);
