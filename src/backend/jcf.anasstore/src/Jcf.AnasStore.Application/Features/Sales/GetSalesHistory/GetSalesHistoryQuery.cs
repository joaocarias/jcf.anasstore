using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetSalesHistory;

public sealed record GetSalesHistoryQuery(
    int Page,
    int PageSize,
    Guid? CustomerUid,
    DateOnly? StartDate,
    DateOnly? EndDate) : IQuery<PagedReadResult<SaleSummaryDto>>;
