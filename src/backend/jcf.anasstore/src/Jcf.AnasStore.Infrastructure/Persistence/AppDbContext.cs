using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, AppRole, long>(options), IApplicationDbContext
{
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<ItemSize> ItemSizes => Set<ItemSize>();
    public DbSet<Sale> Sales => Set<Sale>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(entity =>
        {
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(x => x.Uid).HasColumnName("uid").IsRequired();
            entity.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(x => x.CreateAt).HasColumnName("create_at").IsRequired();
            entity.Property(x => x.UserCreateId).HasColumnName("user_create_id");
            entity.Property(x => x.UpdateAt).HasColumnName("update_at");
            entity.Property(x => x.UserUpdateId).HasColumnName("user_update_id");
            entity.HasIndex(x => x.Uid).IsUnique();
        });

        builder.Entity<AppRole>(entity =>
        {
            entity.Property(x => x.Uid).HasColumnName("uid").IsRequired();
            entity.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(x => x.CreateAt).HasColumnName("create_at").IsRequired();
            entity.Property(x => x.UserCreateId).HasColumnName("user_create_id");
            entity.Property(x => x.UpdateAt).HasColumnName("update_at");
            entity.Property(x => x.UserUpdateId).HasColumnName("user_update_id");
            entity.HasIndex(x => x.Uid).IsUnique();
        });

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public Task AddSaleAsync(Sale sale, CancellationToken cancellationToken)
    {
        return Sales.AddAsync(sale, cancellationToken).AsTask();
    }
}
