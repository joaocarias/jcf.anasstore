using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Dashboard.Common;

public sealed record DashboardSummaryDto(
    decimal DailyRevenue,
    decimal MonthlyRevenue,
    int DailySales,
    int StockItems,
    IReadOnlyList<SaleSummaryDto> LatestSales,
    IReadOnlyList<DashboardProductDto> LatestProducts);
