namespace Jcf.AnasStore.Api.Contracts.Colors;

public sealed record UpdateColorRequest(string Name, string Description, bool? IsActive);
