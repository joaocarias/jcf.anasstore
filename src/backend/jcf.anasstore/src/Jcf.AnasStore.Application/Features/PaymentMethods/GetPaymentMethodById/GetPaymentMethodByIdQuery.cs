using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethodById;

public sealed record GetPaymentMethodByIdQuery(Guid Uid) : IQuery<PaymentMethodReadDto?>;
