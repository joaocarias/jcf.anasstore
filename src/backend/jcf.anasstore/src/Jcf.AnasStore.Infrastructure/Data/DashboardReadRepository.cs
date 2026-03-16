using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Dashboard.Common;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class DashboardReadRepository(string connectionString) : IDashboardReadRepository
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(
        int latestSales,
        int latestProducts,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select
              coalesce((select sum(total_amount) from sales where is_active and create_at >= date_trunc('day', now())), 0) as DailyRevenue,
              coalesce((select sum(total_amount) from sales where is_active and create_at >= date_trunc('month', now())), 0) as MonthlyRevenue,
              (select count(*) from sales where is_active and create_at >= date_trunc('day', now()))::integer as DailySales,
              coalesce((
                select sum(st.quantity)
                from stocks st
                inner join product_variations pv on pv.id = st.product_variation_id and pv.is_active
                inner join products p on p.id = pv.product_id and p.is_active
                where st.is_active
              ), 0)::integer as StockItems;

            select
              s.uid as Uid,
              coalesce(c.name, 'Venda avulsa') as CustomerName,
              s.total_amount as TotalAmount,
              s.create_at as CreateAt
            from sales s
            left join customers c on c.id = s.customer_id and c.is_active
            where s.is_active
            order by s.create_at desc
            limit @LatestSales;

            select
              p.uid as Uid,
              p.name as Name,
              p.sale_price as SalePrice,
              coalesce(stock.quantity, 0)::integer as StockQuantity,
              p.create_at as CreateAt
            from products p
            left join (
              select
                pv.product_id,
                coalesce(sum(st.quantity), 0)::integer as quantity
              from product_variations pv
              inner join stocks st on st.product_variation_id = pv.id and st.is_active
              where pv.is_active
              group by pv.product_id
            ) stock on stock.product_id = p.id
            where p.is_active
            order by p.create_at desc
            limit @LatestProducts;
            """;

        var parameters = new
        {
            LatestSales = Math.Max(latestSales, 1),
            LatestProducts = Math.Max(latestProducts, 1)
        };

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        using var grid = await connection.QueryMultipleAsync(command);
        var summary = await grid.ReadSingleAsync<DashboardSummaryRow>();
        var sales = (await grid.ReadAsync<SaleSummaryDto>()).ToList();
        var products = (await grid.ReadAsync<DashboardProductDto>()).ToList();
        return new DashboardSummaryDto(
            summary.DailyRevenue,
            summary.MonthlyRevenue,
            summary.DailySales,
            summary.StockItems,
            sales,
            products);
    }

    private sealed record DashboardSummaryRow(
        decimal DailyRevenue,
        decimal MonthlyRevenue,
        int DailySales,
        int StockItems);
}
