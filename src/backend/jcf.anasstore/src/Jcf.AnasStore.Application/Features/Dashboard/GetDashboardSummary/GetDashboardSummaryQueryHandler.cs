using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Dashboard.Common;

namespace Jcf.AnasStore.Application.Features.Dashboard.GetDashboardSummary;

public sealed class GetDashboardSummaryQueryHandler(IDashboardReadRepository readRepository)
    : IQueryHandler<GetDashboardSummaryQuery, DashboardSummaryDto>
{
    public Task<DashboardSummaryDto> HandleAsync(GetDashboardSummaryQuery query, CancellationToken cancellationToken)
    {
        return readRepository.GetSummaryAsync(query.LatestSales, query.LatestProducts, cancellationToken);
    }
}
