using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Jcf.AnasStore.Infrastructure.Persistence.Configurations;

public sealed class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");

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

        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
        builder.Property(x => x.IsWhatsApp).HasColumnName("is_whatsapp").IsRequired();
        builder.Property(x => x.AddressId).HasColumnName("address_id").IsRequired();

        builder.HasOne(x => x.Address)
            .WithMany()
            .HasForeignKey(x => x.AddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.Uid).IsUnique();
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.CreateAt);
    }
}
