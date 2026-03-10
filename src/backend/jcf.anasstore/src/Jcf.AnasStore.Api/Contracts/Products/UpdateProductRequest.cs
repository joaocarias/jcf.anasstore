namespace Jcf.AnasStore.Api.Contracts.Products;

public sealed record UpdateProductRequest(
    string Name,
    string Description,
    Guid SupplierUid,
    decimal PurchasePrice,
    decimal SalePrice,
    Guid CategoryUid,
    bool? IsActive);
