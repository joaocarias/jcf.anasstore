using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Category : EntityBase
{
    [Required]
    [StringLength(120)]
    public string Name { get; private set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; private set; } = string.Empty;

    private Category()
    {
    }

    public Category(string name, string description)
    {
        SetValues(name, description);
    }

    public void Update(string name, string description)
    {
        SetValues(name, description);
    }

    private void SetValues(string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        Name = name.Trim();
        Description = description.Trim();
    }
}
