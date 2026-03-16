using Jcf.AnasStore.Application.Features.Dashboard.Common;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Api.Contracts.Dashboard;

public sealed record DashboardSummaryResponse(
    decimal DailyRevenue,
    decimal MonthlyRevenue,
    int DailySales,
    int StockItems,
    IReadOnlyList<SaleSummaryDto> LatestSales,
    IReadOnlyList<DashboardProductDto> LatestProducts);
