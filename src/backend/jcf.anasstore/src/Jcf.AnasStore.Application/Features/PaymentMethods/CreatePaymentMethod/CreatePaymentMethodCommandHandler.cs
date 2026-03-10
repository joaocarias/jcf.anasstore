using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;
using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.CreatePaymentMethod;

public sealed class CreatePaymentMethodCommandHandler(IPaymentMethodsRepository repository)
    : ICommandHandler<CreatePaymentMethodCommand, PaymentMethodReadDto>
{
    public async Task<PaymentMethodReadDto> HandleAsync(CreatePaymentMethodCommand command, CancellationToken cancellationToken)
    {
        var paymentMethod = new PaymentMethod(
            command.Name,
            command.Description,
            command.DiscountPercentage,
            command.MaxInstallments,
            command.DisplayOrder);

        if (!command.IsActive)
        {
            paymentMethod.SetActive(false, command.UserId);
        }

        paymentMethod.SetCreateUser(command.UserId);

        await repository.AddAsync(paymentMethod, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return new PaymentMethodReadDto(
            paymentMethod.Uid,
            paymentMethod.Name,
            paymentMethod.Description,
            paymentMethod.DiscountPercentage,
            paymentMethod.MaxInstallments,
            paymentMethod.DisplayOrder,
            paymentMethod.IsActive,
            paymentMethod.CreateAt,
            paymentMethod.UpdateAt);
    }
}
