using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Jcf.AnasStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CreateOrganization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "organizations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    legal_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    trade_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    cnpj = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    opening_date = table.Column<DateOnly>(type: "date", nullable: true),
                    cnae = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    state_registration = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    administrator = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address_id = table.Column<long>(type: "bigint", nullable: false),
                    uid = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    create_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_create_id = table.Column<long>(type: "bigint", nullable: true),
                    update_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_update_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizations", x => x.id);
                    table.ForeignKey(
                        name: "FK_organizations_addresses_address_id",
                        column: x => x.address_id,
                        principalTable: "addresses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_address_id",
                table: "organizations",
                column: "address_id");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_cnpj",
                table: "organizations",
                column: "cnpj");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_create_at",
                table: "organizations",
                column: "create_at");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_legal_name",
                table: "organizations",
                column: "legal_name");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_trade_name",
                table: "organizations",
                column: "trade_name");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_uid",
                table: "organizations",
                column: "uid",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organizations");
        }
    }
}
