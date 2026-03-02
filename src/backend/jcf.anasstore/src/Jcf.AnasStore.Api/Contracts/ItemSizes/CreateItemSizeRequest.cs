namespace Jcf.AnasStore.Api.Contracts.ItemSizes;

public sealed record CreateItemSizeRequest(string Name, string Description, int Order, bool IsActive = true);
