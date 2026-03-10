using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;

namespace Jcf.AnasStore.Application.Features.Products.GetProductById;

public sealed class GetProductByIdQueryHandler(IProductsReadRepository readRepository)
    : IQueryHandler<GetProductByIdQuery, ProductReadDto?>
{
    public Task<ProductReadDto?> HandleAsync(GetProductByIdQuery query, CancellationToken cancellationToken)
    {
        return readRepository.GetByUidAsync(query.Uid, cancellationToken);
    }
}
