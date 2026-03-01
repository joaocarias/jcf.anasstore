using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetRecentSales;

public sealed class GetRecentSalesQueryHandler(ISalesReadRepository readRepository)
    : IQueryHandler<GetRecentSalesQuery, IReadOnlyList<SaleSummaryDto>>
{
    public async Task<IReadOnlyList<SaleSummaryDto>> HandleAsync(GetRecentSalesQuery query, CancellationToken cancellationToken)
    {
        var take = query.Take <= 0 ? 20 : query.Take;
        take = Math.Min(take, 100);

        return await readRepository.GetLatestAsync(take, cancellationToken);
    }
}
