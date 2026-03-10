namespace Jcf.AnasStore.Api.Contracts.Products;

public sealed record CreateProductRequest(
    string Name,
    string Description,
    Guid SupplierUid,
    decimal PurchasePrice,
    decimal SalePrice,
    Guid CategoryUid,
    bool IsActive = true);
