namespace Jcf.AnasStore.Application.Features.Dashboard.Common;

public sealed record DashboardProductDto(
    Guid Uid,
    string Name,
    decimal SalePrice,
    int StockQuantity,
    DateTime CreateAt);
