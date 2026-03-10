using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Products.Common;

namespace Jcf.AnasStore.Application.Features.Products.GetProductById;

public sealed record GetProductByIdQuery(Guid Uid) : IQuery<ProductReadDto?>;
