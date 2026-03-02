using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class ColorSeeder(AppDbContext dbContext)
{
    private static readonly (string Name, string Description)[] DefaultColors =
    [
        ("Branco(a)", "Cor Branca"),
        ("Preto(a)", "Cor Preta"),
        ("Rosa", "Cor Rosa"),
        ("Vermelho(a)", "Cor Vermelha"),
        ("Amaralho(a)", "Cor Amarela")
    ];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var (name, description) in DefaultColors)
        {
            var existingColor = await dbContext.Colors
                .FirstOrDefaultAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);

            if (existingColor is not null)
            {
                if (!string.Equals(existingColor.Description, description, StringComparison.Ordinal))
                {
                    existingColor.Update(name, description);
                }

                if (!existingColor.IsActive)
                {
                    existingColor.SetActive(true);
                }

                continue;
            }

            await dbContext.Colors.AddAsync(new Color(name, description), cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
