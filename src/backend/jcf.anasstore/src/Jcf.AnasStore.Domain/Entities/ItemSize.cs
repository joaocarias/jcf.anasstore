using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class ItemSize : EntityBase
{
    [Required]
    [StringLength(120)]
    public string Name { get; private set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; private set; } = string.Empty;

    [Required]
    public int Order { get; private set; }

    private ItemSize()
    {
    }

    public ItemSize(string name, string description, int order)
    {
        SetValues(name, description, order);
    }

    public void Update(string name, string description, int order)
    {
        SetValues(name, description, order);
    }

    private void SetValues(string name, string description, int order)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        if (order <= 0)
        {
            throw new ArgumentException("Order must be greater than zero.", nameof(order));
        }

        Name = name.Trim();
        Description = description.Trim();
        Order = order;
    }
}
