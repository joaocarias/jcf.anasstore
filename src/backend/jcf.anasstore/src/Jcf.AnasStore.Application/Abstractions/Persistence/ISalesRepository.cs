using Jcf.AnasStore.Domain.Entities;

namespace Jcf.AnasStore.Application.Abstractions.Persistence;

public interface ISalesRepository
{
    Task<Customer?> GetCustomerByUidAsync(Guid uid, CancellationToken cancellationToken);
    Task<PaymentMethod?> GetPaymentMethodByUidAsync(Guid uid, CancellationToken cancellationToken);
    Task<ProductVariation?> GetProductVariationByUidAsync(Guid uid, CancellationToken cancellationToken);
    Task<decimal?> GetProductSalePriceAsync(long productId, CancellationToken cancellationToken);
    Task<Stock?> GetStockByVariationIdAsync(long variationId, CancellationToken cancellationToken);
    Task AddSaleAsync(Sale sale, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
