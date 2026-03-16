using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Profile;
using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProfileController(UserManager<AppUser> userManager) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var role = await GetPrimaryRoleAsync(user);
        return Ok(new UserProfileResponse(
            user.Uid,
            user.Name,
            user.Email ?? string.Empty,
            role,
            user.CreateAt));
    }

    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Senha atual e nova senha sao obrigatorias." });
        }

        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(x => x.Description).ToArray() });
        }

        user.UpdateAt = DateTime.UtcNow;
        user.UserUpdateId = GetCurrentUserId();
        await userManager.UpdateAsync(user);

        return NoContent();
    }

    private async Task<AppUser?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return null;
        }

        return await userManager.FindByIdAsync(userId.Value.ToString());
    }

    private async Task<string> GetPrimaryRoleAsync(AppUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return roles.FirstOrDefault() ?? "-";
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
