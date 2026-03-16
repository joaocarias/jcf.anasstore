namespace Jcf.AnasStore.Api.Contracts.Sales;

public sealed record CreateSaleItemRequest(Guid ProductVariationUid, int Quantity);

public sealed record CreateSaleRequest(
    Guid? CustomerUid,
    Guid PaymentMethodUid,
    int Installments,
    decimal DiscountAmount,
    IReadOnlyList<CreateSaleItemRequest> Items);
