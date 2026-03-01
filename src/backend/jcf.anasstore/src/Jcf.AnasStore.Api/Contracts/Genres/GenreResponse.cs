namespace Jcf.AnasStore.Api.Contracts.Genres;

public sealed record GenreResponse(
    Guid Uid,
    string Name,
    string Description,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
