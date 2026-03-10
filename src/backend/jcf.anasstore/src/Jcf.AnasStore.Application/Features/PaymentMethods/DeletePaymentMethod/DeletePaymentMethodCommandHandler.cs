using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Persistence;

namespace Jcf.AnasStore.Application.Features.PaymentMethods.DeletePaymentMethod;

public sealed class DeletePaymentMethodCommandHandler(IPaymentMethodsRepository repository)
    : ICommandHandler<DeletePaymentMethodCommand, bool>
{
    public async Task<bool> HandleAsync(DeletePaymentMethodCommand command, CancellationToken cancellationToken)
    {
        var paymentMethod = await repository.GetByUidAsync(command.Uid, cancellationToken);
        if (paymentMethod is null)
        {
            return false;
        }

        paymentMethod.SetActive(false, command.UserId);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
