namespace Jcf.AnasStore.Application.Features.Sales.Common;

public sealed record SaleSummaryDto(Guid Uid, string CustomerName, decimal TotalAmount, DateTime CreateAt);
