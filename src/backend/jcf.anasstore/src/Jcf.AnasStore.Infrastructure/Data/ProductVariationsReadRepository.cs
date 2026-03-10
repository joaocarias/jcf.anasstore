using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class ProductVariationsReadRepository(string connectionString) : IProductVariationsReadRepository
{
    public async Task<PagedReadResult<ProductVariationReadDto>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? productUid,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from product_variations pv
            inner join products p on p.id = pv.product_id and p.is_active
            inner join colors clr on clr.id = pv.color_id and clr.is_active
            inner join item_sizes sz on sz.id = pv.item_size_id and sz.is_active
            where pv.is_active
              and (@ProductUid is null or p.uid = @ProductUid);

            select
              pv.uid as Uid,
              p.uid as ProductUid,
              p.name as ProductName,
              pv.code as Code,
              clr.uid as ColorUid,
              clr.name as ColorName,
              sz.uid as ItemSizeUid,
              sz.name as ItemSizeName,
              coalesce(st.quantity, 0) as StockQuantity,
              pv.is_active as IsActive,
              pv.create_at as CreateAt,
              pv.update_at as UpdateAt
            from product_variations pv
            inner join products p on p.id = pv.product_id and p.is_active
            inner join colors clr on clr.id = pv.color_id and clr.is_active
            inner join item_sizes sz on sz.id = pv.item_size_id and sz.is_active
            left join stocks st on st.product_variation_id = pv.id and st.is_active
            where pv.is_active
              and (@ProductUid is null or p.uid = @ProductUid)
            order by pv.code, clr.name, sz."order"
            offset @Offset rows fetch next @PageSize rows only;
            """;

        var parameters = new
        {
            ProductUid = productUid,
            Offset = (Math.Max(page, 1) - 1) * Math.Max(pageSize, 1),
            PageSize = Math.Max(pageSize, 1)
        };

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        using var grid = await connection.QueryMultipleAsync(command);
        var total = await grid.ReadSingleAsync<int>();
        var items = (await grid.ReadAsync<ProductVariationReadDto>()).ToList();
        return new PagedReadResult<ProductVariationReadDto>(items, total);
    }

    public async Task<ProductVariationReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        const string sql = """
            select
              pv.uid as Uid,
              p.uid as ProductUid,
              p.name as ProductName,
              pv.code as Code,
              clr.uid as ColorUid,
              clr.name as ColorName,
              sz.uid as ItemSizeUid,
              sz.name as ItemSizeName,
              coalesce(st.quantity, 0) as StockQuantity,
              pv.is_active as IsActive,
              pv.create_at as CreateAt,
              pv.update_at as UpdateAt
            from product_variations pv
            inner join products p on p.id = pv.product_id and p.is_active
            inner join colors clr on clr.id = pv.color_id and clr.is_active
            inner join item_sizes sz on sz.id = pv.item_size_id and sz.is_active
            left join stocks st on st.product_variation_id = pv.id and st.is_active
            where pv.is_active
              and pv.uid = @Uid;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Uid = uid }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<ProductVariationReadDto>(command);
    }
}
