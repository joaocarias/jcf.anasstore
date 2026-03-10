using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class PaymentMethod : EntityBase
{
    [Required]
    [StringLength(120)]
    public string Name { get; private set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; private set; } = string.Empty;

    [Range(0, 100)]
    public decimal DiscountPercentage { get; private set; }

    [Range(1, 120)]
    public int MaxInstallments { get; private set; }

    [Range(1, int.MaxValue)]
    public int DisplayOrder { get; private set; }

    private PaymentMethod()
    {
    }

    public PaymentMethod(string name, string description, decimal discountPercentage, int maxInstallments, int displayOrder)
    {
        SetValues(name, description, discountPercentage, maxInstallments, displayOrder);
    }

    public void Update(string name, string description, decimal discountPercentage, int maxInstallments, int displayOrder)
    {
        SetValues(name, description, discountPercentage, maxInstallments, displayOrder);
    }

    private void SetValues(string name, string description, decimal discountPercentage, int maxInstallments, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        if (discountPercentage < 0 || discountPercentage > 100)
        {
            throw new ArgumentException("DiscountPercentage must be between 0 and 100.", nameof(discountPercentage));
        }

        if (maxInstallments <= 0)
        {
            throw new ArgumentException("MaxInstallments must be greater than zero.", nameof(maxInstallments));
        }

        if (displayOrder <= 0)
        {
            throw new ArgumentException("DisplayOrder must be greater than zero.", nameof(displayOrder));
        }

        Name = name.Trim();
        Description = description.Trim();
        DiscountPercentage = discountPercentage;
        MaxInstallments = maxInstallments;
        DisplayOrder = displayOrder;
    }
}
