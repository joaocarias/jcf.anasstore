using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;

namespace Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariations;

public sealed class GetProductVariationsQueryHandler(IProductVariationsReadRepository readRepository)
    : IQueryHandler<GetProductVariationsQuery, PagedReadResult<ProductVariationReadDto>>
{
    public Task<PagedReadResult<ProductVariationReadDto>> HandleAsync(
        GetProductVariationsQuery query,
        CancellationToken cancellationToken)
    {
        return readRepository.GetPagedAsync(query.Page, query.PageSize, query.ProductUid, cancellationToken);
    }
}
