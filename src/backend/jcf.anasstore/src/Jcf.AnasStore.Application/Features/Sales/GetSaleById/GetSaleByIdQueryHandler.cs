using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetSaleById;

public sealed class GetSaleByIdQueryHandler(ISalesReadRepository salesReadRepository)
    : IQueryHandler<GetSaleByIdQuery, SaleDetailDto?>
{
    public Task<SaleDetailDto?> HandleAsync(GetSaleByIdQuery query, CancellationToken cancellationToken)
    {
        return salesReadRepository.GetByUidAsync(query.SaleUid, cancellationToken);
    }
}
