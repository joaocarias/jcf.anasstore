using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IProductsReadRepository
{
    Task<PagedReadResult<ProductReadDto>> GetPagedAsync(int page, int pageSize, string? name, CancellationToken cancellationToken);

    Task<ProductReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);
}
