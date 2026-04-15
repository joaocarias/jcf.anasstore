using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodToSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "installments",
                table: "sales",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<long>(
                name: "payment_method_id",
                table: "sales",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE sales
                SET payment_method_id = (
                    SELECT id FROM payment_methods
                    ORDER BY display_order
                    LIMIT 1
                )
                WHERE payment_method_id IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_sales_payment_method_id",
                table: "sales",
                column: "payment_method_id");

            migrationBuilder.AddForeignKey(
                name: "FK_sales_payment_methods_payment_method_id",
                table: "sales",
                column: "payment_method_id",
                principalTable: "payment_methods",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sales_payment_methods_payment_method_id",
                table: "sales");

            migrationBuilder.DropIndex(
                name: "IX_sales_payment_method_id",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "installments",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "payment_method_id",
                table: "sales");
        }
    }
}
