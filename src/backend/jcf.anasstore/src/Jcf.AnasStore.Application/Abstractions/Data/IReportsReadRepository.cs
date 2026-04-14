using Jcf.AnasStore.Application.Features.Reports.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IReportsReadRepository
{
    Task<SalesReportDto> GetSalesReportAsync(
        DateTime? startDate,
        DateTime? endDate,
        Guid? sellerUid,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AbcReportItemDto>> GetAbcReportAsync(
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken);

    Task<CashFlowReportDto> GetCashFlowReportAsync(
        int year,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<SellerDto>> GetSellersAsync(CancellationToken cancellationToken);
}
