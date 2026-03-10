using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethods;

public sealed class GetPaymentMethodsQueryHandler(IPaymentMethodsReadRepository readRepository)
    : IQueryHandler<GetPaymentMethodsQuery, PagedReadResult<PaymentMethodReadDto>>
{
    public Task<PagedReadResult<PaymentMethodReadDto>> HandleAsync(GetPaymentMethodsQuery query, CancellationToken cancellationToken)
    {
        return readRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
    }
}
