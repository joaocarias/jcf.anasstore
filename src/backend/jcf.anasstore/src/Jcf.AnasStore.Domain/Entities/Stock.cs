namespace Jcf.AnasStore.Domain.Entities;

public sealed class Stock : EntityBase
{
    public long ProductVariationId { get; private set; }
    public ProductVariation? ProductVariation { get; private set; }

    public int Quantity { get; private set; }

    private Stock()
    {
    }

    public Stock(long productVariationId, int quantity)
    {
        SetValues(productVariationId, quantity);
    }

    public void Update(long productVariationId, int quantity)
    {
        SetValues(productVariationId, quantity);
    }

    private void SetValues(long productVariationId, int quantity)
    {
        if (productVariationId <= 0)
        {
            throw new ArgumentException("ProductVariationId is required.", nameof(productVariationId));
        }

        if (quantity < 0)
        {
            throw new ArgumentException("Quantity must be greater or equal to zero.", nameof(quantity));
        }

        ProductVariationId = productVariationId;
        Quantity = quantity;
    }
}
