namespace Jcf.AnasStore.Domain.Entities;

public sealed class ProductVariation : EntityBase
{
    public long ProductId { get; private set; }
    public Product? Product { get; private set; }

    public string Code { get; private set; } = string.Empty;

    public long ColorId { get; private set; }
    public Color? Color { get; private set; }

    public long ItemSizeId { get; private set; }
    public ItemSize? ItemSize { get; private set; }

    private ProductVariation()
    {
    }

    public ProductVariation(long productId, string? code, long colorId, long itemSizeId)
    {
        SetValues(productId, code, colorId, itemSizeId);
    }

    public void Update(long productId, string? code, long colorId, long itemSizeId)
    {
        SetValues(productId, code, colorId, itemSizeId);
    }

    private void SetValues(long productId, string? code, long colorId, long itemSizeId)
    {
        if (productId <= 0)
        {
            throw new ArgumentException("ProductId is required.", nameof(productId));
        }

        if (colorId <= 0)
        {
            throw new ArgumentException("ColorId is required.", nameof(colorId));
        }

        if (itemSizeId <= 0)
        {
            throw new ArgumentException("ItemSizeId is required.", nameof(itemSizeId));
        }

        ProductId = productId;
        Code = code?.Trim() ?? string.Empty;
        ColorId = colorId;
        ItemSizeId = itemSizeId;
    }
}
