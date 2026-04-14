namespace Jcf.AnasStore.Application.Features.Reports.Common;

public record CashFlowMonthDto(
    int Year,
    int Month,
    int SalesCount,
    decimal GrossRevenue,
    decimal TotalDiscounts,
    decimal NetRevenue,
    decimal AverageTicket);

public record PaymentMethodBreakdownDto(
    string PaymentMethodName,
    int SalesCount,
    decimal TotalAmount,
    decimal Percentage);

public record CashFlowReportDto(
    IReadOnlyList<CashFlowMonthDto> Months,
    IReadOnlyList<PaymentMethodBreakdownDto> PaymentBreakdown,
    decimal YearGrossRevenue,
    decimal YearTotalDiscounts,
    decimal YearNetRevenue,
    int YearTotalSales);
