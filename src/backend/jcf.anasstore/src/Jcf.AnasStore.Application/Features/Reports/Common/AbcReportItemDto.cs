namespace Jcf.AnasStore.Application.Features.Reports.Common;

public record AbcReportItemDto(
    int Rank,
    string ProductName,
    int TotalQuantity,
    decimal TotalRevenue,
    decimal RevenuePercentage,
    decimal CumulativePercentage,
    string AbcClass);
