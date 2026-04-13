namespace Jcf.AnasStore.Application.Features.Reports.Common;

public record SalesReportItemDto(
    Guid SaleUid,
    DateTime SaleDate,
    string ProductName,
    string ColorName,
    string SizeName,
    string? VariationCode,
    int Quantity,
    decimal UnitPrice,
    decimal TotalAmount,
    string CustomerName,
    string PaymentMethodName,
    int Installments,
    string SellerName);

public record SalesReportDto(
    IReadOnlyList<SalesReportItemDto> Items,
    decimal TotalRevenue,
    decimal TotalDiscounts,
    int TotalQuantity,
    int TotalSales);
