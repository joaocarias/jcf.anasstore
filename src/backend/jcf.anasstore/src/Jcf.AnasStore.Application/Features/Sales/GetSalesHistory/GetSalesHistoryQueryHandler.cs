using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetSalesHistory;

public sealed class GetSalesHistoryQueryHandler(ISalesReadRepository salesReadRepository)
    : IQueryHandler<GetSalesHistoryQuery, PagedReadResult<SaleSummaryDto>>
{
    public Task<PagedReadResult<SaleSummaryDto>> HandleAsync(GetSalesHistoryQuery query, CancellationToken cancellationToken)
    {
        var startDate = query.StartDate?.ToDateTime(TimeOnly.MinValue);
        var endDate = query.EndDate?.AddDays(1).ToDateTime(TimeOnly.MinValue);

        return salesReadRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            query.CustomerUid,
            startDate,
            endDate,
            cancellationToken);
    }
}
