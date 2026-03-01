using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Sales.Common;

namespace Jcf.AnasStore.Application.Features.Sales.GetRecentSales;

public sealed record GetRecentSalesQuery(int Take) : IQuery<IReadOnlyList<SaleSummaryDto>>;
