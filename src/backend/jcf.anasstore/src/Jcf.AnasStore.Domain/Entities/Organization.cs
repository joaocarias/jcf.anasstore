using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Organization : EntityBase
{
    [Required]
    [StringLength(200)]
    public string LegalName { get; private set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string TradeName { get; private set; } = string.Empty;

    [StringLength(255)]
    public string? Cnpj { get; private set; }

    [Required]
    [StringLength(30)]
    public string Phone { get; private set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [EmailAddress]
    public string Email { get; private set; } = string.Empty;

    public DateOnly? OpeningDate { get; private set; }

    [StringLength(255)]
    public string? Cnae { get; private set; }

    [StringLength(255)]
    public string? StateRegistration { get; private set; }

    [Required]
    [StringLength(200)]
    public string Administrator { get; private set; } = string.Empty;

    public long AddressId { get; private set; }
    public Address? Address { get; private set; }

    private Organization()
    {
    }

    public Organization(
        string legalName,
        string tradeName,
        string? cnpj,
        string phone,
        string email,
        DateOnly? openingDate,
        string? cnae,
        string? stateRegistration,
        string administrator,
        long addressId)
    {
        SetValues(
            legalName,
            tradeName,
            cnpj,
            phone,
            email,
            openingDate,
            cnae,
            stateRegistration,
            administrator,
            addressId);
    }

    public void Update(
        string legalName,
        string tradeName,
        string? cnpj,
        string phone,
        string email,
        DateOnly? openingDate,
        string? cnae,
        string? stateRegistration,
        string administrator,
        long addressId)
    {
        SetValues(
            legalName,
            tradeName,
            cnpj,
            phone,
            email,
            openingDate,
            cnae,
            stateRegistration,
            administrator,
            addressId);
    }

    private void SetValues(
        string legalName,
        string tradeName,
        string? cnpj,
        string phone,
        string email,
        DateOnly? openingDate,
        string? cnae,
        string? stateRegistration,
        string administrator,
        long addressId)
    {
        if (string.IsNullOrWhiteSpace(legalName))
        {
            throw new ArgumentException("LegalName is required.", nameof(legalName));
        }

        if (string.IsNullOrWhiteSpace(tradeName))
        {
            throw new ArgumentException("TradeName is required.", nameof(tradeName));
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new ArgumentException("Phone is required.", nameof(phone));
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        if (string.IsNullOrWhiteSpace(administrator))
        {
            throw new ArgumentException("Administrator is required.", nameof(administrator));
        }

        if (addressId <= 0)
        {
            throw new ArgumentException("AddressId is required.", nameof(addressId));
        }

        LegalName = legalName.Trim();
        TradeName = tradeName.Trim();
        Cnpj = cnpj?.Trim();
        Phone = phone.Trim();
        Email = email.Trim();
        OpeningDate = openingDate;
        Cnae = cnae?.Trim();
        StateRegistration = stateRegistration?.Trim();
        Administrator = administrator.Trim();
        AddressId = addressId;
    }
}
