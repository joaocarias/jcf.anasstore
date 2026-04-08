namespace Jcf.AnasStore.Api.Contracts.Organization;

public sealed record UpdateOrganizationAddressRequest(
    string? Place,
    string? Number,
    string? Neighborhood,
    string? Complement,
    string? ZipCode,
    string? City,
    string? State);

public sealed record UpdateOrganizationRequest(
    string LegalName,
    string TradeName,
    string? Cnpj,
    string Phone,
    string Email,
    DateOnly? OpeningDate,
    string? Cnae,
    string? StateRegistration,
    string Administrator,
    UpdateOrganizationAddressRequest Address);
