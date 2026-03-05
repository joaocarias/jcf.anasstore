namespace Jcf.AnasStore.Api.Contracts.Suppliers;

public sealed record CreateSupplierAddressRequest(
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State);

public sealed record CreateSupplierRequest(
    string Name,
    string Phone,
    string Email,
    bool IsWhatsApp,
    CreateSupplierAddressRequest Address);
