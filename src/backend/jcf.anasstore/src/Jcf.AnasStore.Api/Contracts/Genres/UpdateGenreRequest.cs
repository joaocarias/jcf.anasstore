namespace Jcf.AnasStore.Api.Contracts.Genres;

public sealed record UpdateGenreRequest(string Name, string Description, bool? IsActive);
