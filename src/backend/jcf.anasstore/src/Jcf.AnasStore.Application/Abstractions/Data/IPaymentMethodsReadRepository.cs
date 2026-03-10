using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface IPaymentMethodsReadRepository
{
    Task<PagedReadResult<PaymentMethodReadDto>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<PaymentMethodReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken);
}
