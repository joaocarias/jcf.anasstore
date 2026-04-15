using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCodeBackToProductVariation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "code",
                table: "product_variations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "code",
                table: "product_variations");
        }
    }
}
