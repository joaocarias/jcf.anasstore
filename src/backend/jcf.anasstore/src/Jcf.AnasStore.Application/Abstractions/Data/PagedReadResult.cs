namespace Jcf.AnasStore.Application.Abstractions.Data;

public sealed record PagedReadResult<T>(IReadOnlyList<T> Items, int Total);
