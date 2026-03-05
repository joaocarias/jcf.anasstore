namespace Jcf.AnasStore.Api.Contracts.Products;

public sealed record ProductLookupResponse(Guid Uid, string Name);

public sealed record ProductResponse(
    Guid Uid,
    string Code,
    string Name,
    string Description,
    Guid SupplierUid,
    string SupplierName,
    decimal PurchasePrice,
    decimal SalePrice,
    Guid CategoryUid,
    string CategoryName,
    IReadOnlyCollection<ProductLookupResponse> Colors,
    IReadOnlyCollection<ProductLookupResponse> ItemSizes,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
