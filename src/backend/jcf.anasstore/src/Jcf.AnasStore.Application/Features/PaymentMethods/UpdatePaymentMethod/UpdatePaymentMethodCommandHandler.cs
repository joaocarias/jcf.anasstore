using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.UpdatePaymentMethod;

public sealed class UpdatePaymentMethodCommandHandler(IPaymentMethodsRepository repository)
    : ICommandHandler<UpdatePaymentMethodCommand, PaymentMethodReadDto?>
{
    public async Task<PaymentMethodReadDto?> HandleAsync(UpdatePaymentMethodCommand command, CancellationToken cancellationToken)
    {
        var paymentMethod = await repository.GetByUidAsync(command.Uid, cancellationToken);
        if (paymentMethod is null)
        {
            return null;
        }

        paymentMethod.Update(
            command.Name,
            command.Description,
            command.DiscountPercentage,
            command.MaxInstallments,
            command.DisplayOrder);

        if (command.IsActive.HasValue)
        {
            paymentMethod.SetActive(command.IsActive.Value, command.UserId);
        }
        else
        {
            paymentMethod.SetUpdate(command.UserId);
        }

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
