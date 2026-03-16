using System.Reflection;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Tests.Application.Sales;

public sealed class CreateSaleCommandHandlerTests
{
    [Fact]
    public async Task Should_Create_Sale_And_Save_Changes()
    {
        var fakeRepository = new FakeSalesRepository();
        var handler = new CreateSaleCommandHandler(fakeRepository);

        var saleId = await handler.HandleAsync(
            new CreateSaleCommand(
                null,
                fakeRepository.PaymentMethodUid,
                1,
                10m,
                [new CreateSaleItem(fakeRepository.VariationUid, 2)],
                1),
            CancellationToken.None);

        Assert.NotEqual(Guid.Empty, saleId);
        Assert.Single(fakeRepository.Sales);
        Assert.Equal(1, fakeRepository.SaveChangesCallCount);
    }

    private sealed class FakeSalesRepository : ISalesRepository
    {
        public List<Sale> Sales { get; } = [];
        public int SaveChangesCallCount { get; private set; }
        public Guid VariationUid { get; } = Guid.NewGuid();
        public Guid PaymentMethodUid { get; } = Guid.NewGuid();
        private readonly ProductVariation _variation;
        private readonly Stock _stock;
        private readonly PaymentMethod _paymentMethod;

        public FakeSalesRepository()
        {
            _variation = new ProductVariation(10, null, 1, 1);
            SetEntityId(_variation, 1);
            SetEntityUid(_variation, VariationUid);
            _stock = new Stock(_variation.Id, 5);
            _paymentMethod = new PaymentMethod("Cartao", "Cartao de credito", 10m, 3, 1);
            SetEntityId(_paymentMethod, 11);
            SetEntityUid(_paymentMethod, PaymentMethodUid);
        }

        public Task<Customer?> GetCustomerByUidAsync(Guid uid, CancellationToken cancellationToken)
        {
            return Task.FromResult<Customer?>(null);
        }

        public Task<PaymentMethod?> GetPaymentMethodByUidAsync(Guid uid, CancellationToken cancellationToken)
        {
            return Task.FromResult(uid == PaymentMethodUid ? _paymentMethod : null);
        }

        public Task<ProductVariation?> GetProductVariationByUidAsync(Guid uid, CancellationToken cancellationToken)
        {
            return Task.FromResult(uid == VariationUid ? _variation : null);
        }

        public Task<decimal?> GetProductSalePriceAsync(long productId, CancellationToken cancellationToken)
        {
            return Task.FromResult<decimal?>(50m);
        }

        public Task<Stock?> GetStockByVariationIdAsync(long variationId, CancellationToken cancellationToken)
        {
            return Task.FromResult(variationId == _variation.Id ? _stock : null);
        }

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

        private static void SetEntityId(EntityBase entity, long id)
        {
            var property = typeof(EntityBase).GetProperty("Id", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            property?.SetValue(entity, id);
        }

        private static void SetEntityUid(EntityBase entity, Guid uid)
        {
            var property = typeof(EntityBase).GetProperty("Uid", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            property?.SetValue(entity, uid);
        }
    }
}
