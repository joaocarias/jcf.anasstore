using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;

namespace Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariationById;

public sealed class GetProductVariationByIdQueryHandler(IProductVariationsReadRepository readRepository)
    : IQueryHandler<GetProductVariationByIdQuery, ProductVariationReadDto?>
{
    public Task<ProductVariationReadDto?> HandleAsync(
        GetProductVariationByIdQuery query,
        CancellationToken cancellationToken)
    {
        return readRepository.GetByUidAsync(query.Uid, cancellationToken);
    }
}
