using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class ProductsReadRepository(string connectionString) : IProductsReadRepository
{
    public async Task<PagedReadResult<ProductReadDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? name,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from products p
            inner join suppliers s on s.id = p.supplier_id and s.is_active
            inner join categories c on c.id = p.category_id and c.is_active
            where p.is_active
              and (@Name is null or p.name ilike '%' || @Name || '%');

            select
              p.uid as Uid,
              p.name as Name,
              p.description as Description,
              s.uid as SupplierUid,
              s.name as SupplierName,
              p.purchase_price as PurchasePrice,
              p.sale_price as SalePrice,
              coalesce(stock.quantity, 0)::integer as StockQuantity,
              c.uid as CategoryUid,
              c.name as CategoryName,
              p.is_active as IsActive,
              p.create_at as CreateAt,
              p.update_at as UpdateAt
            from products p
            inner join suppliers s on s.id = p.supplier_id and s.is_active
            inner join categories c on c.id = p.category_id and c.is_active
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
              and (@Name is null or p.name ilike '%' || @Name || '%')
            order by p.name
            offset @Offset rows fetch next @PageSize rows only;
            """;

        var parameters = new
        {
            Name = string.IsNullOrWhiteSpace(name) ? null : name.Trim(),
            Offset = (Math.Max(page, 1) - 1) * Math.Max(pageSize, 1),
            PageSize = Math.Max(pageSize, 1)
        };

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        using var grid = await connection.QueryMultipleAsync(command);
        var total = await grid.ReadSingleAsync<int>();
        var items = (await grid.ReadAsync<ProductReadDto>()).ToList();
        return new PagedReadResult<ProductReadDto>(items, total);
    }

    public async Task<ProductReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        const string sql = """
            select
              p.uid as Uid,
              p.name as Name,
              p.description as Description,
              s.uid as SupplierUid,
              s.name as SupplierName,
              p.purchase_price as PurchasePrice,
              p.sale_price as SalePrice,
              coalesce(stock.quantity, 0)::integer as StockQuantity,
              c.uid as CategoryUid,
              c.name as CategoryName,
              p.is_active as IsActive,
              p.create_at as CreateAt,
              p.update_at as UpdateAt
            from products p
            inner join suppliers s on s.id = p.supplier_id and s.is_active
            inner join categories c on c.id = p.category_id and c.is_active
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
              and p.uid = @Uid;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Uid = uid }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<ProductReadDto>(command);
    }
}
