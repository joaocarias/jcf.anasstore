using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Jcf.AnasStore.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasColumnType("bigint")
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        builder.Property(x => x.Uid).HasColumnName("uid").IsRequired();
        builder.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(x => x.CreateAt).HasColumnName("create_at").IsRequired();
        builder.Property(x => x.UserCreateId).HasColumnName("user_create_id");
        builder.Property(x => x.UpdateAt).HasColumnName("update_at");
        builder.Property(x => x.UserUpdateId).HasColumnName("user_update_id");

        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(1000).IsRequired();
        builder.Property(x => x.SupplierId).HasColumnName("supplier_id").IsRequired();
        builder.Property(x => x.PurchasePrice).HasColumnName("purchase_price").HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(x => x.SalePrice).HasColumnName("sale_price").HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(x => x.CategoryId).HasColumnName("category_id").IsRequired();

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Colors)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "product_colors",
                right => right.HasOne<Color>().WithMany().HasForeignKey("color_id").OnDelete(DeleteBehavior.Cascade),
                left => left.HasOne<Product>().WithMany().HasForeignKey("product_id").OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.HasKey("product_id", "color_id");
                    join.ToTable("product_colors");
                });

        builder.HasMany(x => x.ItemSizes)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "product_item_sizes",
                right => right.HasOne<ItemSize>().WithMany().HasForeignKey("item_size_id").OnDelete(DeleteBehavior.Cascade),
                left => left.HasOne<Product>().WithMany().HasForeignKey("product_id").OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.HasKey("product_id", "item_size_id");
                    join.ToTable("product_item_sizes");
                });

        builder.HasIndex(x => x.Uid).IsUnique();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.CreateAt);
    }
}
