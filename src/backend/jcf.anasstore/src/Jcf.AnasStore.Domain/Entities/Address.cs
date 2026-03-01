using System.ComponentModel.DataAnnotations;

namespace Jcf.AnasStore.Domain.Entities;

public sealed class Address : EntityBase
{
    [StringLength(100)]
    public string? Place { get; private set; }

    [StringLength(10)]
    public string? Number { get; private set; }

    [StringLength(100)]
    public string? Neighborhood { get; private set; }

    [StringLength(100)]
    public string? Complement { get; private set; }

    [StringLength(20)]
    public string? ZipCode { get; private set; }

    [StringLength(100)]
    public string? City { get; private set; }

    [StringLength(2)]
    public string? State { get; private set; }

    private Address()
    {
    }

    public Address(
        string? place,
        string? number,
        string? neighborhood,
        string? complement,
        string? zipCode,
        string? city,
        string? state)
    {
        Place = place?.Trim();
        Number = number?.Trim();
        Neighborhood = neighborhood?.Trim();
        Complement = complement?.Trim();
        ZipCode = zipCode?.Trim();
        City = city?.Trim();
        State = state?.Trim();
    }
}
