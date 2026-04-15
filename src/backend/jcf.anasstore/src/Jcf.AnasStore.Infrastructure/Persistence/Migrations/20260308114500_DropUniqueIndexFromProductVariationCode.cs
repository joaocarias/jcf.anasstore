using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropUniqueIndexFromProductVariationCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                drop index if exists "IX_product_variations_code";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                create unique index if not exists "IX_product_variations_code"
                on product_variations (code);
                """);
        }
    }
}
