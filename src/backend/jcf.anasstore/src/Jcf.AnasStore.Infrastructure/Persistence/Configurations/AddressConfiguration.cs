using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Jcf.AnasStore.Infrastructure.Persistence.Configurations;

public sealed class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.ToTable("addresses");

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

        builder.Property(x => x.Place).HasColumnName("place").HasMaxLength(100);
        builder.Property(x => x.Number).HasColumnName("number").HasMaxLength(10);
        builder.Property(x => x.Neighborhood).HasColumnName("neighborhood").HasMaxLength(100);
        builder.Property(x => x.Complement).HasColumnName("complement").HasMaxLength(100);
        builder.Property(x => x.ZipCode).HasColumnName("zip_code").HasMaxLength(20);
        builder.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
        builder.Property(x => x.State).HasColumnName("state").HasMaxLength(2);

        builder.HasIndex(x => x.Uid).IsUnique();
        builder.HasIndex(x => x.CreateAt);
    }
}
