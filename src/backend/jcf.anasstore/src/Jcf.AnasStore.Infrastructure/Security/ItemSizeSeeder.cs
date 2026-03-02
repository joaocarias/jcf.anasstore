using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class ItemSizeSeeder(AppDbContext dbContext)
{
    private static readonly (string Name, string Description, int Order)[] DefaultItemSizes =
    [
        ("PP", "Tamanho Menor Pequeno", 1),
        ("P", "Tamanho Pequeno", 2),
        ("M", "Tamanho Medio", 3),
        ("G", "Tamanho Grande", 4),
        ("GG", "Tamanho Maior Grande", 5),
        ("XG", "Tamanho Extra Grande", 6),
        ("XXG", "Tamanho Maior Extra Grande", 7)
    ];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var (name, description, order) in DefaultItemSizes)
        {
            var existingItemSize = await dbContext.ItemSizes
                .FirstOrDefaultAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);

            if (existingItemSize is not null)
            {
                if (!string.Equals(existingItemSize.Description, description, StringComparison.Ordinal) || existingItemSize.Order != order)
                {
                    existingItemSize.Update(name, description, order);
                }

                if (!existingItemSize.IsActive)
                {
                    existingItemSize.SetActive(true);
                }

                continue;
            }

            await dbContext.ItemSizes.AddAsync(new ItemSize(name, description, order), cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
