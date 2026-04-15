using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorProductsToVariationsAndStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_colors");

            migrationBuilder.DropTable(
                name: "product_item_sizes");

            migrationBuilder.DropIndex(
                name: "IX_products_code",
                table: "products");

            migrationBuilder.DropColumn(
                name: "code",
                table: "products");

            migrationBuilder.CreateTable(
                name: "product_variations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    color_id = table.Column<long>(type: "bigint", nullable: false),
                    item_size_id = table.Column<long>(type: "bigint", nullable: false),
                    uid = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    create_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_create_id = table.Column<long>(type: "bigint", nullable: true),
                    update_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_update_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_variations", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_variations_colors_color_id",
                        column: x => x.color_id,
                        principalTable: "colors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_product_variations_item_sizes_item_size_id",
                        column: x => x.item_size_id,
                        principalTable: "item_sizes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_product_variations_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stocks",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_variation_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    uid = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    create_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_create_id = table.Column<long>(type: "bigint", nullable: true),
                    update_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_update_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stocks", x => x.id);
                    table.ForeignKey(
                        name: "FK_stocks_product_variations_product_variation_id",
                        column: x => x.product_variation_id,
                        principalTable: "product_variations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_code",
                table: "product_variations",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_color_id",
                table: "product_variations",
                column: "color_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_create_at",
                table: "product_variations",
                column: "create_at");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_item_size_id",
                table: "product_variations",
                column: "item_size_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_product_id",
                table: "product_variations",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_variations_uid",
                table: "product_variations",
                column: "uid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stocks_create_at",
                table: "stocks",
                column: "create_at");

            migrationBuilder.CreateIndex(
                name: "IX_stocks_product_variation_id",
                table: "stocks",
                column: "product_variation_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stocks_uid",
                table: "stocks",
                column: "uid",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "stocks");

            migrationBuilder.DropTable(
                name: "product_variations");

            migrationBuilder.AddColumn<string>(
                name: "code",
                table: "products",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "product_colors",
                columns: table => new
                {
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    color_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_colors", x => new { x.product_id, x.color_id });
                    table.ForeignKey(
                        name: "FK_product_colors_colors_color_id",
                        column: x => x.color_id,
                        principalTable: "colors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_colors_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_item_sizes",
                columns: table => new
                {
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    item_size_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_item_sizes", x => new { x.product_id, x.item_size_id });
                    table.ForeignKey(
                        name: "FK_product_item_sizes_item_sizes_item_size_id",
                        column: x => x.item_size_id,
                        principalTable: "item_sizes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_item_sizes_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_products_code",
                table: "products",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_colors_color_id",
                table: "product_colors",
                column: "color_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_item_sizes_item_size_id",
                table: "product_item_sizes",
                column: "item_size_id");
        }
    }
}
