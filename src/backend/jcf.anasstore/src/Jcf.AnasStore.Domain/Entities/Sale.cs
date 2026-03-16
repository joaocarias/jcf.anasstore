namespace Jcf.AnasStore.Domain.Entities;

public sealed class Sale : EntityBase
{
    public long? CustomerId { get; private set; }
    public Customer? Customer { get; private set; }

    public long PaymentMethodId { get; private set; }
    public PaymentMethod? PaymentMethod { get; private set; }

    public int Installments { get; private set; }

    public decimal SubtotalAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TotalAmount { get; private set; }

    public ICollection<SaleItem> Items { get; private set; } = new List<SaleItem>();

    private Sale()
    {
    }

    public Sale(long? customerId, long paymentMethodId, int installments, decimal subtotalAmount, decimal discountAmount)
    {
        SetValues(customerId, paymentMethodId, installments, subtotalAmount, discountAmount);
    }

    public void AddItem(SaleItem item)
    {
        Items.Add(item);
    }

    private void SetValues(long? customerId, long paymentMethodId, int installments, decimal subtotalAmount, decimal discountAmount)
    {
        if (paymentMethodId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(paymentMethodId), "PaymentMethodId is required.");
        }

        if (installments <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(installments), "Installments must be greater than zero.");
        }

        if (subtotalAmount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(subtotalAmount), "Subtotal must be greater than zero.");
        }

        if (discountAmount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(discountAmount), "Discount must be zero or greater.");
        }

        if (discountAmount > subtotalAmount)
        {
            throw new ArgumentOutOfRangeException(nameof(discountAmount), "Discount cannot be greater than subtotal.");
        }

        CustomerId = customerId;
        PaymentMethodId = paymentMethodId;
        Installments = installments;
        SubtotalAmount = subtotalAmount;
        DiscountAmount = discountAmount;
        TotalAmount = subtotalAmount - discountAmount;
    }
}
