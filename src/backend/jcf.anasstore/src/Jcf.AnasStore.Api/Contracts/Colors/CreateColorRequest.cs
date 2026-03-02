namespace Jcf.AnasStore.Api.Contracts.Colors;

public sealed record CreateColorRequest(string Name, string Description, bool IsActive = true);
