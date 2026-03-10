namespace Jcf.AnasStore.Application.Features.Products.Common;

public sealed record ProductReadDto(
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
