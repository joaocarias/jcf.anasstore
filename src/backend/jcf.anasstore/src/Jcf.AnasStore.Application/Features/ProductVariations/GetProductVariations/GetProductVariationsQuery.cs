using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;

namespace Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariations;

public sealed record GetProductVariationsQuery(int Page, int PageSize, Guid? ProductUid)
    : IQuery<PagedReadResult<ProductVariationReadDto>>;
