namespace Jcf.AnasStore.Api.Contracts.Genres;

public sealed record CreateGenreRequest(string Name, string Description, bool IsActive = true);
