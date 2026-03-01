using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Tests.Application.Sales;

public sealed class CreateSaleCommandHandlerTests
{
    [Fact]
    public async Task Should_Create_Sale_And_Save_Changes()
    {
        var fakeDbContext = new FakeDbContext();
        var handler = new CreateSaleCommandHandler(fakeDbContext);

        var saleId = await handler.HandleAsync(new CreateSaleCommand("client@anasstore.com", 120.50m), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, saleId);
        Assert.Single(fakeDbContext.Sales);
        Assert.Equal(1, fakeDbContext.SaveChangesCallCount);
    }

    private sealed class FakeDbContext : IApplicationDbContext
    {
        public List<Sale> Sales { get; } = [];
        public int SaveChangesCallCount { get; private set; }

        public Task AddSaleAsync(Sale sale, CancellationToken cancellationToken)
        {
            Sales.Add(sale);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken)
        {
            SaveChangesCallCount++;
            return Task.FromResult(1);
        }
    }
}
