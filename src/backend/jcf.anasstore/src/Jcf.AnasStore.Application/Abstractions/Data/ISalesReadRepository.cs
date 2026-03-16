using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface ISalesReadRepository
{
    Task<IReadOnlyList<SaleSummaryDto>> GetLatestAsync(int take, CancellationToken cancellationToken);
    Task<SaleDetailDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);
    Task<PagedReadResult<SaleSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? customerUid,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken);
}
