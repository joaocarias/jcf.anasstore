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
              id as Id,
              uid as Uid,
              customer_email as CustomerEmail,
              total_amount as TotalAmount,
              create_at as CreateAt
            from sales
            order by create_at desc
            limit @Take;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Take = take }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<SaleSummaryDto>(command);
        return rows.ToList();
    }
}
