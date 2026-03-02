using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Customer : EntityBase
{
    [Required]
    [StringLength(200)]
    public string Name { get; private set; } = string.Empty;

    public long GenreId { get; private set; }
    public Genre? Genre { get; private set; }

    public DateOnly? BirthDate { get; private set; }

    [Required]
    [StringLength(30)]
    public string Phone { get; private set; } = string.Empty;

    public bool IsWhatsApp { get; private set; }

    public long AddressId { get; private set; }
    public Address? Address { get; private set; }

    private Customer()
    {
    }

    public Customer(
        string name,
        long genreId,
        DateOnly? birthDate,
        string phone,
        bool isWhatsApp,
        long addressId)
    {
        SetValues(name, genreId, birthDate, phone, isWhatsApp, addressId);
    }

    public void Update(
        string name,
        long genreId,
        DateOnly? birthDate,
        string phone,
        bool isWhatsApp,
        long addressId)
    {
        SetValues(name, genreId, birthDate, phone, isWhatsApp, addressId);
    }

    private void SetValues(
        string name,
        long genreId,
        DateOnly? birthDate,
        string phone,
        bool isWhatsApp,
        long addressId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        if (genreId <= 0)
        {
            throw new ArgumentException("GenreId is required.", nameof(genreId));
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new ArgumentException("Phone is required.", nameof(phone));
        }

        if (addressId <= 0)
        {
            throw new ArgumentException("AddressId is required.", nameof(addressId));
        }

        Name = name.Trim();
        GenreId = genreId;
        BirthDate = birthDate;
        Phone = phone.Trim();
        IsWhatsApp = isWhatsApp;
        AddressId = addressId;
    }
}
