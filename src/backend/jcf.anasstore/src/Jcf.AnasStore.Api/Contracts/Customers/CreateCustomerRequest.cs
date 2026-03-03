namespace Jcf.AnasStore.Api.Contracts.Customers;

public sealed record CreateCustomerAddressRequest(
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State);

public sealed record CreateCustomerRequest(
    string Name,
    Guid GenreUid,
    DateOnly? BirthDate,
    string Phone,
    bool IsWhatsApp,
    CreateCustomerAddressRequest Address);
