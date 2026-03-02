namespace Jcf.AnasStore.Api.Contracts.Colors;

public sealed record ColorResponse(
    Guid Uid,
    string Name,
    string Description,
    bool IsActive,
    DateTime CreateAt,
    DateTime? UpdateAt);
