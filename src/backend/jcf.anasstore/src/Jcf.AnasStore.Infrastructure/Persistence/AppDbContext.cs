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
    public DbSet<Color> Colors => Set<Color>();
    public DbSet<Customer> Customers => Set<Customer>();
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
            entity.HasQueryFilter(x => x.IsActive);
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
            entity.HasQueryFilter(x => x.IsActive);
        });

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        builder.Entity<Address>().HasQueryFilter(x => x.IsActive);
        builder.Entity<Color>().HasQueryFilter(x => x.IsActive);
        builder.Entity<Customer>().HasQueryFilter(x => x.IsActive);
        builder.Entity<Genre>().HasQueryFilter(x => x.IsActive);
        builder.Entity<ItemSize>().HasQueryFilter(x => x.IsActive);
        builder.Entity<Sale>().HasQueryFilter(x => x.IsActive);
    }

    public Task AddSaleAsync(Sale sale, CancellationToken cancellationToken)
    {
        return Sales.AddAsync(sale, cancellationToken).AsTask();
    }
}
