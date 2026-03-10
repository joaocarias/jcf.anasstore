using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;

namespace Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariationById;

public sealed record GetProductVariationByIdQuery(Guid Uid) : IQuery<ProductVariationReadDto?>;
