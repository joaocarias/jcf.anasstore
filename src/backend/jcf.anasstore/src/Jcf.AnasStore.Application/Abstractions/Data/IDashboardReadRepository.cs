using Jcf.AnasStore.Application.Features.Dashboard.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IDashboardReadRepository
{
    Task<DashboardSummaryDto> GetSummaryAsync(int latestSales, int latestProducts, CancellationToken cancellationToken);
}
