namespace Jcf.AnasStore.Api.Contracts.Customers;

public sealed record CreateCustomerRequest(
    string Name,
    long GenreId,
    DateOnly? BirthDate,
    string Phone,
    bool IsWhatsApp,
    long AddressId,
    bool IsActive = true);
