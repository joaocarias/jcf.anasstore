namespace Jcf.AnasStore.Application.Features.Sales.Common;

public sealed record SaleItemDetailDto(
    Guid ProductVariationUid,
    string ProductName,
    string ColorName,
    string ItemSizeName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalAmount);

public sealed record SaleDetailDto(
    Guid Uid,
    string? CustomerName,
    string? CustomerPhone,
    bool? CustomerIsWhatsApp,
    string PaymentMethodName,
    int Installments,
    decimal SubtotalAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    IReadOnlyList<SaleItemDetailDto> Items);
