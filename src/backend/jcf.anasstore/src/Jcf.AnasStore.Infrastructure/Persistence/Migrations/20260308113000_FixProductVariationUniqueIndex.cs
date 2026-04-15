using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixProductVariationUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                do $$
                declare
                    idx_name text;
                begin
                    select indexname
                    into idx_name
                    from pg_indexes
                    where schemaname = 'public'
                      and tablename = 'product_variations'
                      and indexdef ilike 'create unique index%'
                      and indexdef ilike '%(product_id, color_id)%'
                      and indexdef not ilike '%item_size_id%';

                    if idx_name is not null then
                        execute format('drop index if exists %I', idx_name);
                    end if;
                end
                $$;
                """);

            migrationBuilder.Sql(
                """
                create unique index if not exists "IX_product_variations_product_id_color_id_item_size_id"
                on product_variations (product_id, color_id, item_size_id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                drop index if exists "IX_product_variations_product_id_color_id_item_size_id";
                """);
        }
    }
}
