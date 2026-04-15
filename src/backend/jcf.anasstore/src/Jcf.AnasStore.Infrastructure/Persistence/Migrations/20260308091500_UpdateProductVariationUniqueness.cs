using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductVariationUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_product_variations_code",
                table: "product_variations");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_product_id_color_id_item_size_id",
                table: "product_variations",
                columns: new[] { "product_id", "color_id", "item_size_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_product_variations_product_id_color_id_item_size_id",
                table: "product_variations");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_code",
                table: "product_variations",
                column: "code",
                unique: true);
        }
    }
}
