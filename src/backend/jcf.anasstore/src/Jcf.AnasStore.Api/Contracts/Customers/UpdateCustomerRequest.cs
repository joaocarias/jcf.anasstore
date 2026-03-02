namespace Jcf.AnasStore.Api.Contracts.Customers;

public sealed record UpdateCustomerRequest(
    string Name,
    long GenreId,
    DateOnly? BirthDate,
    string Phone,
    bool IsWhatsApp,
    long AddressId,
    bool? IsActive);
