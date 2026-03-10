using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethods;

public sealed record GetPaymentMethodsQuery(int Page, int PageSize)
    : IQuery<PagedReadResult<PaymentMethodReadDto>>;
