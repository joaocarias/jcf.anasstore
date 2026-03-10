namespace Jcf.AnasStore.Api.Contracts.Products;

public sealed record ProductResponse(
    Guid Uid,
    string Name,
    string Description,
    Guid SupplierUid,
    string SupplierName,
    decimal PurchasePrice,
    decimal SalePrice,
    int StockQuantity,
    Guid CategoryUid,
    string CategoryName,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
