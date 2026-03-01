namespace Jcf.AnasStore.Application.Features.Sales.Common;

public sealed record SaleSummaryDto(Guid Uid, string CustomerEmail, decimal TotalAmount, DateTime CreateAt);
