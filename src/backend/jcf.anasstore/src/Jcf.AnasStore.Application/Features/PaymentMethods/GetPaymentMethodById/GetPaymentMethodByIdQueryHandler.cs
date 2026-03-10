using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethodById;

public sealed class GetPaymentMethodByIdQueryHandler(IPaymentMethodsReadRepository readRepository)
    : IQueryHandler<GetPaymentMethodByIdQuery, PaymentMethodReadDto?>
{
    public Task<PaymentMethodReadDto?> HandleAsync(GetPaymentMethodByIdQuery query, CancellationToken cancellationToken)
    {
        return readRepository.GetByUidAsync(query.Uid, cancellationToken);
    }
}
