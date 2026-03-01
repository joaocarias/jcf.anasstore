using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Abstractions.Persistence;

public interface IApplicationDbContext
{
    Task AddSaleAsync(Sale sale, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
