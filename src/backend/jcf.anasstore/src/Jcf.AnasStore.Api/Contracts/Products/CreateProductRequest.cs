namespace Jcf.AnasStore.Api.Contracts.Products;

public sealed record CreateProductRequest(
    string Code,
    string Name,
    string Description,
    Guid SupplierUid,
    decimal PurchasePrice,
    decimal SalePrice,
    Guid CategoryUid,
    IReadOnlyCollection<Guid>? ColorUids,
    IReadOnlyCollection<Guid>? ItemSizeUids,
    bool IsActive = true);
