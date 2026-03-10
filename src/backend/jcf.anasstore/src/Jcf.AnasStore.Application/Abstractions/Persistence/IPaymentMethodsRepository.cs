using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Abstractions.Persistence;

public interface IPaymentMethodsRepository
{
    Task<PaymentMethod?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);

    Task AddAsync(PaymentMethod paymentMethod, CancellationToken cancellationToken);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
