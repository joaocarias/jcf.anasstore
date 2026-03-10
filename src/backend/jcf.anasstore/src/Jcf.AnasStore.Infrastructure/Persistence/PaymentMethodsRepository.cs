using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Persistence;

public sealed class PaymentMethodsRepository(AppDbContext dbContext) : IPaymentMethodsRepository
{
    public Task<PaymentMethod?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        return dbContext.PaymentMethods.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
    }

    public Task AddAsync(PaymentMethod paymentMethod, CancellationToken cancellationToken)
    {
        return dbContext.PaymentMethods.AddAsync(paymentMethod, cancellationToken).AsTask();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
