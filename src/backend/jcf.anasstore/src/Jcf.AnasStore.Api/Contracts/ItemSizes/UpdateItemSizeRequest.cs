namespace Jcf.AnasStore.Api.Contracts.ItemSizes;

public sealed record UpdateItemSizeRequest(string Name, string Description, int Order, bool? IsActive);
