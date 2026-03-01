using Dapper;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Roles.Common;
using Npgsql;

namespace Jcf.AnasStore.Infrastructure.Data;

public sealed class RolesReadRepository(string connectionString) : IRolesReadRepository
{
    public async Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            select
              uid as Uid,
              "Name" as Name,
              is_active as IsActive,
              create_at as CreateAt
            from "AspNetRoles"
            order by "Name";
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<RoleDto>(command);
        return rows.ToList();
    }

    public async Task<RoleDto?> GetByUidAsync(Guid uid, CancellationToken cancellationToken)
    {
        const string sql = """
            select
              uid as Uid,
              "Name" as Name,
              is_active as IsActive,
              create_at as CreateAt
            from "AspNetRoles"
            where uid = @Uid;
            """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(sql, new { Uid = uid }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<RoleDto>(command);
    }
}
