using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface ISalesReadRepository
{
    Task<IReadOnlyList<SaleSummaryDto>> GetLatestAsync(int take, CancellationToken cancellationToken);
}
