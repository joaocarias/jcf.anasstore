using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Jcf.AnasStore.Infrastructure.Persistence.Configurations;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

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

        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(500).IsRequired();

        builder.HasIndex(x => x.Uid).IsUnique();
        builder.HasIndex(x => x.CreateAt);
        builder.HasIndex(x => x.Name);
    }
}
