using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Product : EntityBase
{
    [Required]
    [StringLength(50)]
    public string Code { get; private set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; private set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Description { get; private set; } = string.Empty;

    public long SupplierId { get; private set; }
    public Supplier? Supplier { get; private set; }

    public decimal PurchasePrice { get; private set; }
    public decimal SalePrice { get; private set; }

    public long CategoryId { get; private set; }
    public Category? Category { get; private set; }

    public ICollection<Color> Colors { get; private set; } = [];
    public ICollection<ItemSize> ItemSizes { get; private set; } = [];

    private Product()
    {
    }

    public Product(
        string code,
        string name,
        string description,
        long supplierId,
        decimal purchasePrice,
        decimal salePrice,
        long categoryId)
    {
        SetValues(code, name, description, supplierId, purchasePrice, salePrice, categoryId);
    }

    public void Update(
        string code,
        string name,
        string description,
        long supplierId,
        decimal purchasePrice,
        decimal salePrice,
        long categoryId)
    {
        SetValues(code, name, description, supplierId, purchasePrice, salePrice, categoryId);
    }

    public void SetColors(IReadOnlyCollection<Color> colors)
    {
        Colors = colors.ToList();
    }

    public void SetItemSizes(IReadOnlyCollection<ItemSize> itemSizes)
    {
        ItemSizes = itemSizes.ToList();
    }

    private void SetValues(
        string code,
        string name,
        string description,
        long supplierId,
        decimal purchasePrice,
        decimal salePrice,
        long categoryId)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Code is required.", nameof(code));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        if (supplierId <= 0)
        {
            throw new ArgumentException("SupplierId is required.", nameof(supplierId));
        }

        if (purchasePrice <= 0)
        {
            throw new ArgumentException("PurchasePrice is required.", nameof(purchasePrice));
        }

        if (salePrice <= 0)
        {
            throw new ArgumentException("SalePrice is required.", nameof(salePrice));
        }

        if (categoryId <= 0)
        {
            throw new ArgumentException("CategoryId is required.", nameof(categoryId));
        }

        Code = code.Trim();
        Name = name.Trim();
        Description = description.Trim();
        SupplierId = supplierId;
        PurchasePrice = purchasePrice;
        SalePrice = salePrice;
        CategoryId = categoryId;
    }
}
