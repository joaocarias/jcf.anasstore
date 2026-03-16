namespace Jcf.AnasStore.Domain.Entities;

public sealed class SaleItem : EntityBase
{
    public long SaleId { get; private set; }
    public Sale? Sale { get; private set; }

    public long ProductVariationId { get; private set; }
    public ProductVariation? ProductVariation { get; private set; }

    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal TotalAmount { get; private set; }

    private SaleItem()
    {
    }

    public SaleItem(long productVariationId, int quantity, decimal unitPrice)
    {
        SetValues(productVariationId, quantity, unitPrice);
    }

    private void SetValues(long productVariationId, int quantity, decimal unitPrice)
    {
        if (productVariationId <= 0)
        {
            throw new ArgumentException("ProductVariationId is required.", nameof(productVariationId));
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        if (unitPrice <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price must be greater than zero.");
        }

        ProductVariationId = productVariationId;
        Quantity = quantity;
        UnitPrice = unitPrice;
        TotalAmount = unitPrice * quantity;
    }
}
