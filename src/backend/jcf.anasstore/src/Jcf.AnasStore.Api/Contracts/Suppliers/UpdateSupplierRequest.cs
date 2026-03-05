namespace Jcf.AnasStore.Api.Contracts.Suppliers;

public sealed record UpdateSupplierAddressRequest(
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State);

public sealed record UpdateSupplierRequest(
    string Name,
    string Phone,
    string Email,
    bool IsWhatsApp,
    UpdateSupplierAddressRequest Address,
    bool? IsActive);
