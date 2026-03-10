using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;

namespace Jcf.AnasStore.Application.Features.Products.GetProducts;

public sealed record GetProductsQuery(int Page, int PageSize, string? Name)
    : IQuery<PagedReadResult<ProductReadDto>>;
