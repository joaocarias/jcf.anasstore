using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Infrastructure.Identity;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class IdentityService(
    UserManager<AppUser> userManager,
    AppDbContext dbContext,
    IOptions<JwtSettings> jwtSettings) : IIdentityService
{
    private const string RefreshTokenProvider = "Jcf.AnasStore";

    public async Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return null;
        }

        var isPasswordValid = await userManager.CheckPasswordAsync(user, password);
        if (!isPasswordValid)
        {
            return null;
        }

        var roles = (await userManager.GetRolesAsync(user)).ToList();
        return new AuthenticatedUser(user.Id, user.Email ?? email, roles);
    }

    public async Task SaveRefreshTokenAsync(long userId, string refreshToken, CancellationToken cancellationToken)
    {
        var expiresAtUtc = DateTime.UtcNow.AddDays(jwtSettings.Value.RefreshTokenExpirationDays);

        var existingTokens = await dbContext.Set<IdentityUserToken<long>>()
            .Where(x => x.UserId == userId && x.LoginProvider == RefreshTokenProvider)
            .ToListAsync(cancellationToken);

        if (existingTokens.Count > 0)
        {
            dbContext.RemoveRange(existingTokens);
        }

        var token = new IdentityUserToken<long>
        {
            UserId = userId,
            LoginProvider = RefreshTokenProvider,
            Name = refreshToken,
            Value = expiresAtUtc.ToString("O")
        };

        await dbContext.AddAsync(token, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthenticatedUser?> GetUserByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var token = await dbContext.Set<IdentityUserToken<long>>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.LoginProvider == RefreshTokenProvider && x.Name == refreshToken,
                cancellationToken);

        if (token is null)
        {
            return null;
        }

        if (!DateTime.TryParse(token.Value, out var expiresAtUtc) || expiresAtUtc <= DateTime.UtcNow)
        {
            await RevokeRefreshTokenAsync(refreshToken, cancellationToken);
            return null;
        }

        var user = await userManager.FindByIdAsync(token.UserId.ToString());
        if (user is null)
        {
            return null;
        }

        var roles = (await userManager.GetRolesAsync(user)).ToList();
        return new AuthenticatedUser(user.Id, user.Email ?? string.Empty, roles);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var token = await dbContext.Set<IdentityUserToken<long>>()
            .FirstOrDefaultAsync(
                x => x.LoginProvider == RefreshTokenProvider && x.Name == refreshToken,
                cancellationToken);

        if (token is null)
        {
            return;
        }

        dbContext.Remove(token);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
