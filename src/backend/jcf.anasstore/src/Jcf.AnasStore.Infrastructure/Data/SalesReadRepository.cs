using System.Data;
using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class SalesReadRepository(string connectionString) : ISalesReadRepository
{
    public async Task<IReadOnlyList<SaleSummaryDto>> GetLatestAsync(int take, CancellationToken cancellationToken)
    {
        const string sql = """
            select
              s.uid as Uid,
              coalesce(c.name, 'Venda avulsa') as CustomerName,
              s.total_amount as TotalAmount,
              s.create_at as CreateAt
            from sales s
            left join customers c on c.id = s.customer_id and c.is_active
            order by create_at desc
            limit @Take;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Take = take }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<SaleSummaryDto>(command);
        return rows.ToList();
    }

    public async Task<SaleDetailDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        const string headerSql = """
            select
              s.id as Id,
              s.uid as Uid,
              s.installments as Installments,
              s.subtotal_amount as SubtotalAmount,
              s.discount_amount as DiscountAmount,
              s.total_amount as TotalAmount,
              pm.name as PaymentMethodName,
              c.name as CustomerName,
              c.phone as CustomerPhone,
              c.is_whatsapp as CustomerIsWhatsApp
            from sales s
            left join customers c on c.id = s.customer_id and c.is_active
            inner join payment_methods pm on pm.id = s.payment_method_id and pm.is_active
            where s.uid = @Uid and s.is_active;
            """;

        const string itemsSql = """
            select
              pv.uid as ProductVariationUid,
              p.name as ProductName,
              co.name as ColorName,
              sz.name as ItemSizeName,
              si.quantity as Quantity,
              si.unit_price as UnitPrice,
              si.total_amount as TotalAmount
            from sale_items si
            inner join product_variations pv on pv.id = si.product_variation_id
            inner join products p on p.id = pv.product_id
            inner join colors co on co.id = pv.color_id
            inner join item_sizes sz on sz.id = pv.item_size_id
            where si.sale_id = @SaleId and si.is_active
            order by p.name, co.name, sz.name;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        var header = await connection.QuerySingleOrDefaultAsync<SaleDetailRow>(
            new CommandDefinition(headerSql, new { Uid = uid }, cancellationToken: cancellationToken));
        if (header is null)
        {
            return null;
        }

        var items = await connection.QueryAsync<SaleItemDetailDto>(
            new CommandDefinition(itemsSql, new { SaleId = header.Id }, cancellationToken: cancellationToken));

        return new SaleDetailDto(
            header.Uid,
            header.CustomerName,
            header.CustomerPhone,
            header.CustomerIsWhatsApp,
            header.PaymentMethodName,
            header.Installments,
            header.SubtotalAmount,
            header.DiscountAmount,
            header.TotalAmount,
            items.ToList());
    }

    public async Task<PagedReadResult<SaleSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? customerUid,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from sales s
            left join customers c on c.id = s.customer_id and c.is_active
            where s.is_active
              and (@CustomerUid is null or c.uid = @CustomerUid::uuid)
              and (@StartDate is null or s.create_at >= @StartDate::timestamptz)
              and (@EndDate is null or s.create_at < @EndDate::timestamptz);

            select
              s.uid as Uid,
              coalesce(c.name, 'Venda avulsa') as CustomerName,
              s.total_amount as TotalAmount,
              s.create_at as CreateAt
            from sales s
            left join customers c on c.id = s.customer_id and c.is_active
            where s.is_active
              and (@CustomerUid is null or c.uid = @CustomerUid::uuid)
              and (@StartDate is null or s.create_at >= @StartDate::timestamptz)
              and (@EndDate is null or s.create_at < @EndDate::timestamptz)
            order by s.create_at desc
            offset @Offset rows fetch next @PageSize rows only;
            """;

        var parameters = new DynamicParameters();
        parameters.Add("CustomerUid", customerUid, DbType.Guid);
        parameters.Add("StartDate", startDate, DbType.DateTime);
        parameters.Add("EndDate", endDate, DbType.DateTime);
        parameters.Add("Offset", (Math.Max(page, 1) - 1) * Math.Max(pageSize, 1));
        parameters.Add("PageSize", Math.Max(pageSize, 1));

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        using var grid = await connection.QueryMultipleAsync(command);
        var total = await grid.ReadSingleAsync<int>();
        var items = (await grid.ReadAsync<SaleSummaryDto>()).ToList();
        return new PagedReadResult<SaleSummaryDto>(items, total);
    }

    private sealed record SaleDetailRow(
        long Id,
        Guid Uid,
        int Installments,
        decimal SubtotalAmount,
        decimal DiscountAmount,
        decimal TotalAmount,
        string PaymentMethodName,
        string? CustomerName,
        string? CustomerPhone,
        bool? CustomerIsWhatsApp);
}
