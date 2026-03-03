namespace Jcf.AnasStore.Api.Contracts.Customers;

public sealed record CustomerResponse(
    Guid Uid,
    string Name,
    Guid GenreUid,
    string GenreName,
    DateOnly? BirthDate,
    string Phone,
    bool IsWhatsApp,
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
