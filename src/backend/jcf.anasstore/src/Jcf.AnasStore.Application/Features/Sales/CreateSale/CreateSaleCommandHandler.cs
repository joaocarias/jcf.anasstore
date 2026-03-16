using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Features.Sales.CreateSale;

public sealed class CreateSaleCommandHandler(ISalesRepository salesRepository) : ICommandHandler<CreateSaleCommand, Guid>
{
    public async Task<Guid> HandleAsync(CreateSaleCommand command, CancellationToken cancellationToken)
    {
        if (command.Items is null || command.Items.Count == 0)
        {
            throw new ArgumentException("At least one item is required.", nameof(command.Items));
        }

        var paymentMethod = await salesRepository.GetPaymentMethodByUidAsync(command.PaymentMethodUid, cancellationToken);
        if (paymentMethod is null)
        {
            throw new ArgumentException("PaymentMethodUid is invalid.", nameof(command.PaymentMethodUid));
        }

        if (command.Installments <= 0 || command.Installments > paymentMethod.MaxInstallments)
        {
            throw new ArgumentException("Installments are invalid for payment method.", nameof(command.Installments));
        }

        long? customerId = null;
        if (command.CustomerUid.HasValue)
        {
            var customer = await salesRepository.GetCustomerByUidAsync(command.CustomerUid.Value, cancellationToken);
            if (customer is null)
            {
                throw new ArgumentException("CustomerUid is invalid.", nameof(command.CustomerUid));
            }
            customerId = customer.Id;
        }

        var saleItems = new List<SaleItem>();
        decimal subtotal = 0m;

        foreach (var item in command.Items)
        {
            if (item.Quantity <= 0)
            {
                throw new ArgumentException("Quantity must be greater than zero.", nameof(command.Items));
            }

            var variation = await salesRepository.GetProductVariationByUidAsync(item.ProductVariationUid, cancellationToken);
            if (variation is null)
            {
                throw new ArgumentException("ProductVariationUid is invalid.", nameof(command.Items));
            }

            var stock = await salesRepository.GetStockByVariationIdAsync(variation.Id, cancellationToken);
            var available = stock?.Quantity ?? 0;
            if (available < item.Quantity)
            {
                throw new ArgumentException("Insufficient stock for product variation.", nameof(command.Items));
            }

            var unitPrice = await salesRepository.GetProductSalePriceAsync(variation.ProductId, cancellationToken);
            if (!unitPrice.HasValue)
            {
                throw new ArgumentException("Product not found for product variation.", nameof(command.Items));
            }

            if (unitPrice.Value <= 0)
            {
                throw new ArgumentException("Product sale price must be greater than zero.", nameof(command.Items));
            }

            subtotal += unitPrice.Value * item.Quantity;
            saleItems.Add(new SaleItem(variation.Id, item.Quantity, unitPrice.Value));

            stock!.Update(variation.Id, available - item.Quantity);
            stock.SetUpdate(command.UserId);
        }

        var sale = new Sale(customerId, paymentMethod.Id, command.Installments, subtotal, command.DiscountAmount);
        sale.SetCreateUser(command.UserId);

        foreach (var item in saleItems)
        {
            sale.AddItem(item);
        }

        await salesRepository.AddSaleAsync(sale, cancellationToken);
        await salesRepository.SaveChangesAsync(cancellationToken);

        return sale.Uid;
    }
}
