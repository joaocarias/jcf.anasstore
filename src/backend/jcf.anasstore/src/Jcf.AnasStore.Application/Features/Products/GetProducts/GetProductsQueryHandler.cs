using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;

namespace Jcf.AnasStore.Application.Features.Products.GetProducts;

public sealed class GetProductsQueryHandler(IProductsReadRepository readRepository)
    : IQueryHandler<GetProductsQuery, PagedReadResult<ProductReadDto>>
{
    public Task<PagedReadResult<ProductReadDto>> HandleAsync(GetProductsQuery query, CancellationToken cancellationToken)
    {
        return readRepository.GetPagedAsync(query.Page, query.PageSize, query.Name, cancellationToken);
    }
}
