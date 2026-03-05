using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Supplier : EntityBase
{
    [Required]
    [StringLength(200)]
    public string Name { get; private set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string Phone { get; private set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [EmailAddress]
    public string Email { get; private set; } = string.Empty;

    public bool IsWhatsApp { get; private set; }

    public long AddressId { get; private set; }
    public Address? Address { get; private set; }

    private Supplier()
    {
    }

    public Supplier(string name, string phone, string email, bool isWhatsApp, long addressId)
    {
        SetValues(name, phone, email, isWhatsApp, addressId);
    }

    public void Update(string name, string phone, string email, bool isWhatsApp, long addressId)
    {
        SetValues(name, phone, email, isWhatsApp, addressId);
    }

    private void SetValues(string name, string phone, string email, bool isWhatsApp, long addressId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new ArgumentException("Phone is required.", nameof(phone));
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        if (addressId <= 0)
        {
            throw new ArgumentException("AddressId is required.", nameof(addressId));
        }

        Name = name.Trim();
        Phone = phone.Trim();
        Email = email.Trim();
        IsWhatsApp = isWhatsApp;
        AddressId = addressId;
    }
}
