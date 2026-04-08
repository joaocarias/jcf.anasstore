using Jcf.AnasStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Jcf.AnasStore.Infrastructure.Persistence.Configurations;

public sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organizations");

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

        builder.Property(x => x.LegalName).HasColumnName("legal_name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.TradeName).HasColumnName("trade_name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Cnpj).HasColumnName("cnpj").HasMaxLength(255);
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
        builder.Property(x => x.OpeningDate).HasColumnName("opening_date");
        builder.Property(x => x.Cnae).HasColumnName("cnae").HasMaxLength(255);
        builder.Property(x => x.StateRegistration).HasColumnName("state_registration").HasMaxLength(255);
        builder.Property(x => x.Administrator).HasColumnName("administrator").HasMaxLength(200).IsRequired();
        builder.Property(x => x.AddressId).HasColumnName("address_id").IsRequired();

        builder.HasOne(x => x.Address)
            .WithMany()
            .HasForeignKey(x => x.AddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.Uid).IsUnique();
        builder.HasIndex(x => x.LegalName);
        builder.HasIndex(x => x.TradeName);
        builder.HasIndex(x => x.Cnpj);
        builder.HasIndex(x => x.CreateAt);
    }
}
