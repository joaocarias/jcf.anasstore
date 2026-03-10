using Jcf.AnasStore.Application.Features.ProductVariations.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IProductVariationsReadRepository
{
    Task<PagedReadResult<ProductVariationReadDto>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? productUid,
        CancellationToken cancellationToken);

    Task<ProductVariationReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);
}
