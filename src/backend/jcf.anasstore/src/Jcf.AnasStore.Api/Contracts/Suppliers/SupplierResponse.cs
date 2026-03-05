namespace Jcf.AnasStore.Api.Contracts.Suppliers;

public sealed record SupplierResponse(
    Guid Uid,
    string Name,
    string Phone,
    string Email,
    bool IsWhatsApp,
    long AddressId,
    Guid AddressUid,
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
