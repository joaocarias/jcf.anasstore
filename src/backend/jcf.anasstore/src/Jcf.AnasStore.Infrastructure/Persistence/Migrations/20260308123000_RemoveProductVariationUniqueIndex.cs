using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations;

public partial class RemoveProductVariationUniqueIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            drop index if exists "IX_product_variations_product_id_color_id_item_size_id";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_product_variations_product_id_color_id_item_size_id",
            table: "product_variations",
            columns: new[] { "product_id", "color_id", "item_size_id" },
            unique: true);
    }
}
