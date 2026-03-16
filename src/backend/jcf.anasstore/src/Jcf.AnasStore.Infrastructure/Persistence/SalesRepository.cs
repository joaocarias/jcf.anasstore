using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Persistence;

public sealed class SalesRepository(AppDbContext dbContext) : ISalesRepository
{
    public Task<Customer?> GetCustomerByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        return dbContext.Customers.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
    }

    public Task<PaymentMethod?> GetPaymentMethodByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        return dbContext.PaymentMethods.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
    }

    public Task<ProductVariation?> GetProductVariationByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        return dbContext.ProductVariations
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
    }

    public async Task<decimal?> GetProductSalePriceAsync(long productId, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == productId, cancellationToken);
        return product?.SalePrice;
    }

    public Task<Stock?> GetStockByVariationIdAsync(long variationId, CancellationToken cancellationToken)
    {
        return dbContext.Stocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.ProductVariationId == variationId, cancellationToken);
    }

    public Task AddSaleAsync(Sale sale, CancellationToken cancellationToken)
    {
        return dbContext.Sales.AddAsync(sale, cancellationToken).AsTask();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
