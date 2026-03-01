using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class GenreSeeder(AppDbContext dbContext)
{
    private static readonly (string Name, string Description)[] DefaultGenres =
    [
        ("Masculino", "Masculino"),
        ("Feminino", "Feminino")
    ];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var (name, description) in DefaultGenres)
        {
            var existingGenre = await dbContext.Genres
                .FirstOrDefaultAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);

            if (existingGenre is not null)
            {
                if (!string.Equals(existingGenre.Description, description, StringComparison.Ordinal))
                {
                    existingGenre.Update(name, description);
                }

                if (!existingGenre.IsActive)
                {
                    existingGenre.SetActive(true);
                }

                continue;
            }

            await dbContext.Genres.AddAsync(new Genre(name, description), cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
