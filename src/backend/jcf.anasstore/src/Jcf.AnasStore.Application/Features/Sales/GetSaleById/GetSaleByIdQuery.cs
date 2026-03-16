using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetSaleById;

public sealed record GetSaleByIdQuery(Guid SaleUid) : IQuery<SaleDetailDto?>;
