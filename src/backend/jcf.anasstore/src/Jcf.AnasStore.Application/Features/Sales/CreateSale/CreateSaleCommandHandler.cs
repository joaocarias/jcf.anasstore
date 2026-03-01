using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Features.Sales.CreateSale;

public sealed class CreateSaleCommandHandler(IApplicationDbContext dbContext) : ICommandHandler<CreateSaleCommand, Guid>
{
    public async Task<Guid> HandleAsync(CreateSaleCommand command, CancellationToken cancellationToken)
    {
        var sale = new Sale(command.CustomerEmail, command.TotalAmount);

        await dbContext.AddSaleAsync(sale, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return sale.Uid;
    }
}
