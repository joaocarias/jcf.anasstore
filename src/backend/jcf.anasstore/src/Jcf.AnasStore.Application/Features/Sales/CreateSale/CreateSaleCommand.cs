using Jcf.AnasStore.Application.Abstractions.Cqrs;

namespace Jcf.AnasStore.Application.Features.Sales.CreateSale;

public sealed record CreateSaleItem(Guid ProductVariationUid, int Quantity);

public sealed record CreateSaleCommand(
    Guid? CustomerUid,
    Guid PaymentMethodUid,
    int Installments,
    decimal DiscountAmount,
    IReadOnlyList<CreateSaleItem> Items,
    long? UserId) : ICommand<Guid>;
