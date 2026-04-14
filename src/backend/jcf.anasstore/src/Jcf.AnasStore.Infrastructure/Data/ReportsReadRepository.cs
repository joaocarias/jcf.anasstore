using System.Data;
using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Reports.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class ReportsReadRepository(string connectionString) : IReportsReadRepository
{
    public async Task<SalesReportDto> GetSalesReportAsync(
        DateTime? startDate,
        DateTime? endDate,
        Guid? sellerUid,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select
              s.uid            as SaleUid,
              s.create_at      as SaleDate,
              p.name           as ProductName,
              co.name          as ColorName,
              sz.name          as SizeName,
              pv.code          as VariationCode,
              si.quantity      as Quantity,
              si.unit_price    as UnitPrice,
              si.total_amount  as TotalAmount,
              coalesce(c.name, 'Venda avulsa') as CustomerName,
              pm.name          as PaymentMethodName,
              s.installments   as Installments,
              coalesce(u.name, 'N/D') as SellerName,
              s.discount_amount as DiscountAmount
            from sales s
            inner join sale_items si       on si.sale_id = s.id and si.is_active
            inner join product_variations pv on pv.id = si.product_variation_id
            inner join products p          on p.id = pv.product_id
            inner join colors co           on co.id = pv.color_id
            inner join item_sizes sz       on sz.id = pv.item_size_id
            left join  customers c         on c.id = s.customer_id and c.is_active
            inner join payment_methods pm  on pm.id = s.payment_method_id and pm.is_active
            left join  "AspNetUsers" u     on u."Id" = s.user_create_id
            where s.is_active
              and (@StartDate is null or s.create_at >= @StartDate::timestamptz)
              and (@EndDate   is null or s.create_at <  @EndDate::date + interval '1 day')
              and (@SellerUid is null or u.uid = @SellerUid::uuid)
            order by s.create_at desc, p.name;
            """;

        var parameters = new DynamicParameters();
        parameters.Add("StartDate", ToUtc(startDate), DbType.DateTime);
        parameters.Add("EndDate", ToUtc(endDate), DbType.DateTime);
        parameters.Add("SellerUid", sellerUid, DbType.Guid);

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        var rows = (await connection.QueryAsync<SalesReportRow>(command)).ToList();

        var items = rows.Select(r => new SalesReportItemDto(
            r.SaleUid,
            r.SaleDate,
            r.ProductName,
            r.ColorName,
            r.SizeName,
            r.VariationCode,
            r.Quantity,
            r.UnitPrice,
            r.TotalAmount,
            r.CustomerName,
            r.PaymentMethodName,
            r.Installments,
            r.SellerName)).ToList();

        var totalRevenue = rows.GroupBy(r => r.SaleUid).Sum(g => g.First().TotalAmount);
        var totalDiscounts = rows.GroupBy(r => r.SaleUid).Sum(g => g.First().DiscountAmount);
        var totalQuantity = rows.Sum(r => r.Quantity);
        var totalSales = rows.Select(r => r.SaleUid).Distinct().Count();

        return new SalesReportDto(items, totalRevenue, totalDiscounts, totalQuantity, totalSales);
    }

    public async Task<IReadOnlyList<AbcReportItemDto>> GetAbcReportAsync(
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        const string sql = """
            with product_sales as (
              select
                p.name                       as ProductName,
                sum(si.quantity)::integer    as TotalQuantity,
                sum(si.total_amount)         as TotalRevenue
              from sales s
              inner join sale_items si         on si.sale_id = s.id and si.is_active
              inner join product_variations pv on pv.id = si.product_variation_id
              inner join products p            on p.id = pv.product_id
              where s.is_active
                and (@StartDate is null or s.create_at >= @StartDate::timestamptz)
                and (@EndDate   is null or s.create_at <  @EndDate::date + interval '1 day')
              group by p.id, p.name
            ),
            grand_total as (
              select coalesce(sum(TotalRevenue), 0) as Total from product_sales
            ),
            ranked as (
              select
                row_number() over (order by ps.TotalRevenue desc)::integer as Rank,
                ps.ProductName,
                ps.TotalQuantity,
                ps.TotalRevenue,
                case when gt.Total > 0 then round(ps.TotalRevenue / gt.Total * 100, 2) else 0 end as RevenuePercentage,
                round(sum(ps.TotalRevenue / nullif(gt.Total, 0) * 100) over (order by ps.TotalRevenue desc), 2) as CumulativePercentage
              from product_sales ps
              cross join grand_total gt
            )
            select
              r.Rank,
              r.ProductName,
              r.TotalQuantity,
              r.TotalRevenue,
              r.RevenuePercentage,
              r.CumulativePercentage,
              case
                when r.CumulativePercentage <= 80 then 'A'
                when r.CumulativePercentage <= 95 then 'B'
                else 'C'
              end as AbcClass
            from ranked r
            order by r.Rank;
            """;

        var parameters = new DynamicParameters();
        parameters.Add("StartDate", ToUtc(startDate), DbType.DateTime);
        parameters.Add("EndDate", ToUtc(endDate), DbType.DateTime);

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<AbcReportItemDto>(command);
        return rows.ToList();
    }

    public async Task<CashFlowReportDto> GetCashFlowReportAsync(
        int year,
        CancellationToken cancellationToken)
    {
        const string monthlySql = """
            select
              extract(year  from s.create_at)::integer                                   as Year,
              extract(month from s.create_at)::integer                                   as Month,
              count(distinct s.id)::integer                                               as SalesCount,
              coalesce(sum(s.subtotal_amount), 0)                                         as GrossRevenue,
              coalesce(sum(s.discount_amount), 0)                                         as TotalDiscounts,
              coalesce(sum(s.total_amount), 0)                                            as NetRevenue,
              case when count(distinct s.id) > 0
                then round(sum(s.total_amount) / count(distinct s.id), 2)
                else 0
              end                                                                          as AverageTicket
            from sales s
            where s.is_active
              and extract(year from s.create_at) = @Year
            group by extract(year from s.create_at), extract(month from s.create_at)
            order by extract(month from s.create_at);
            """;

        const string paymentSql = """
            select
              pm.name                              as PaymentMethodName,
              count(distinct s.id)::integer        as SalesCount,
              coalesce(sum(s.total_amount), 0)     as TotalAmount
            from sales s
            inner join payment_methods pm on pm.id = s.payment_method_id and pm.is_active
            where s.is_active
              and extract(year from s.create_at) = @Year
            group by pm.id, pm.name
            order by sum(s.total_amount) desc;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        var months = (await connection.QueryAsync<CashFlowMonthDto>(
            new CommandDefinition(monthlySql, new { Year = year }, cancellationToken: cancellationToken))).ToList();

        var paymentRows = (await connection.QueryAsync<PaymentMethodBreakdownRow>(
            new CommandDefinition(paymentSql, new { Year = year }, cancellationToken: cancellationToken))).ToList();

        var grandTotal = paymentRows.Sum(r => r.TotalAmount);
        var breakdown = paymentRows.Select(r => new PaymentMethodBreakdownDto(
            r.PaymentMethodName,
            r.SalesCount,
            r.TotalAmount,
            grandTotal > 0 ? Math.Round(r.TotalAmount / grandTotal * 100, 2) : 0)).ToList();

        return new CashFlowReportDto(
            months,
            breakdown,
            months.Sum(m => m.GrossRevenue),
            months.Sum(m => m.TotalDiscounts),
            months.Sum(m => m.NetRevenue),
            months.Sum(m => m.SalesCount));
    }

    public async Task<IReadOnlyList<SellerDto>> GetSellersAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            select distinct
              u.uid  as Uid,
              u.name as Name
            from sales s
            inner join "AspNetUsers" u on u."Id" = s.user_create_id
            where s.is_active
            order by u.name;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<SellerDto>(command);
        return rows.ToList();
    }

    private sealed record SalesReportRow(
        Guid SaleUid,
        DateTime SaleDate,
        string ProductName,
        string ColorName,
        string SizeName,
        string? VariationCode,
        int Quantity,
        decimal UnitPrice,
        decimal TotalAmount,
        string CustomerName,
        string PaymentMethodName,
        int Installments,
        string SellerName,
        decimal DiscountAmount);

    private sealed record PaymentMethodBreakdownRow(
        string PaymentMethodName,
        int SalesCount,
        decimal TotalAmount);

    private static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;
}
