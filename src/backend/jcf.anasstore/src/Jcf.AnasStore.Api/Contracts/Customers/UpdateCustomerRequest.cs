namespace Jcf.AnasStore.Api.Contracts.Customers;

public sealed record UpdateCustomerAddressRequest(
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State);

public sealed record UpdateCustomerRequest(
    string Name,
    Guid GenreUid,
    DateOnly? BirthDate,
    string Phone,
    bool IsWhatsApp,
    UpdateCustomerAddressRequest Address,
    bool? IsActive);
