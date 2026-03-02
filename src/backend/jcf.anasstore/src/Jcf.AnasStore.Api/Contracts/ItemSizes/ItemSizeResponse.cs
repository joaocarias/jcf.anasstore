namespace Jcf.AnasStore.Api.Contracts.ItemSizes;

public sealed record ItemSizeResponse(
    Guid Uid,
    string Name,
    string Description,
    int Order,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
