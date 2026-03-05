namespace Jcf.AnasStore.Api.Contracts.Categories;

public sealed record CategoryResponse(
    Guid Uid,
    string Name,
    string Description,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
