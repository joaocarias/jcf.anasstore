using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class PaymentMethodsReadRepository(string connectionString) : IPaymentMethodsReadRepository
{
    public async Task<PagedReadResult<PaymentMethodReadDto>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from payment_methods pm
            where pm.is_active;

            select
              pm.uid as Uid,
              pm.name as Name,
              pm.description as Description,
              pm.discount_percentage as DiscountPercentage,
              pm.max_installments as MaxInstallments,
              pm.display_order as DisplayOrder,
              pm.is_active as IsActive,
              pm.create_at as CreateAt,
              pm.update_at as UpdateAt
            from payment_methods pm
            where pm.is_active
            order by pm.display_order, pm.name
            offset @Offset rows fetch next @PageSize rows only;
            """;

        var safePage = Math.Max(page, 1);
        var safePageSize = Math.Max(pageSize, 1);
        var parameters = new
        {
            Offset = (safePage - 1) * safePageSize,
            PageSize = safePageSize
        };

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
        using var grid = await connection.QueryMultipleAsync(command);
        var total = await grid.ReadSingleAsync<int>();
        var items = (await grid.ReadAsync<PaymentMethodReadDto>()).ToList();
        return new PagedReadResult<PaymentMethodReadDto>(items, total);
    }

    public async Task<PaymentMethodReadDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        const string sql = """
            select
              pm.uid as Uid,
              pm.name as Name,
              pm.description as Description,
              pm.discount_percentage as DiscountPercentage,
              pm.max_installments as MaxInstallments,
              pm.display_order as DisplayOrder,
              pm.is_active as IsActive,
              pm.create_at as CreateAt,
              pm.update_at as UpdateAt
            from payment_methods pm
            where pm.is_active
              and pm.uid = @Uid;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Uid = uid }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<PaymentMethodReadDto>(command);
    }
}
