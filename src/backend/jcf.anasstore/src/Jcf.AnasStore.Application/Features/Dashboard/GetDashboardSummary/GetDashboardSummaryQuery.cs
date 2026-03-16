using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Dashboard.Common;

namespace Jcf.AnasStore.Application.Features.Dashboard.GetDashboardSummary;

public sealed record GetDashboardSummaryQuery(int LatestSales, int LatestProducts)
    : IQuery<DashboardSummaryDto>;
