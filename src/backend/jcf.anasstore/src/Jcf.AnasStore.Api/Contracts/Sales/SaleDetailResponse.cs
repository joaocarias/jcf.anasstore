namespace Jcf.AnasStore.Api.Contracts.Sales;

public sealed record SaleItemResponse(
    Guid ProductVariationUid,
    string ProductName,
    string ColorName,
    string ItemSizeName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalAmount);

public sealed record SaleDetailResponse(
    Guid Uid,
    string? CustomerName,
    string? CustomerPhone,
    bool? CustomerIsWhatsApp,
    string PaymentMethodName,
    int Installments,
    decimal SubtotalAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    IReadOnlyList<SaleItemResponse> Items);
