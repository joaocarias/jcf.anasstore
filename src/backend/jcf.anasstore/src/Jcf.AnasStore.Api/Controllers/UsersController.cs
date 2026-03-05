using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Users;
using Jcf.AnasStore.Infrastructure.Identity;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName},{IdentitySeeder.AuditorRoleName}")]
[Route("api/[controller]")]
public sealed class UsersController(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager) : ControllerBase
{
    /// <summary>
    /// Lists all users.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await userManager.Users.CountAsync(cancellationToken);

        var users = await userManager.Users
            .OrderBy(x => x.Email)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        var items = new List<UserResponse>(users.Count);
        foreach (var user in users)
        {
            items.Add(await ToResponseAsync(user));
        }

        return Ok(new PagedResponse<UserResponse>(
            items,
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a user by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(await ToResponseAsync(user));
    }

    /// <summary>
    /// Creates a user.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(CreateUserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!await roleManager.RoleExistsAsync(request.RoleName))
        {
            return BadRequest(new { message = $"Role '{request.RoleName}' does not exist." });
        }

        var generatedPassword = GenerateInitialPassword(request.Name, DateTime.Now);

        var user = new AppUser
        {
            Name = request.Name.Trim(),
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            IsActive = request.IsActive,
            CreateAt = DateTime.UtcNow,
            UserCreateId = GetCurrentUserId()
        };

        var createResult = await userManager.CreateAsync(user, generatedPassword);
        if (!createResult.Succeeded)
        {
            return BadRequest(new { errors = createResult.Errors.Select(x => x.Description).ToArray() });
        }

        var roleResult = await userManager.AddToRoleAsync(user, request.RoleName);
        if (!roleResult.Succeeded)
        {
            return BadRequest(new { errors = roleResult.Errors.Select(x => x.Description).ToArray() });
        }

        var response = await ToResponseAsync(user);
        return CreatedAtAction(
            nameof(GetByUid),
            new { uid = user.Uid },
            new CreateUserResponse(response, generatedPassword));
    }

    /// <summary>
    /// Updates a user by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email;
            user.UserName = request.Email;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name.Trim();
        }

        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }

        user.UpdateAt = DateTime.UtcNow;
        user.UserUpdateId = GetCurrentUserId();

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(x => x.Description).ToArray() });
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.Password);
            if (!resetResult.Succeeded)
            {
                return BadRequest(new { errors = resetResult.Errors.Select(x => x.Description).ToArray() });
            }
        }

        if (!string.IsNullOrWhiteSpace(request.RoleName))
        {
            if (!await roleManager.RoleExistsAsync(request.RoleName))
            {
                return BadRequest(new { message = $"Role '{request.RoleName}' does not exist." });
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(new { errors = removeResult.Errors.Select(x => x.Description).ToArray() });
                }
            }

            var addResult = await userManager.AddToRoleAsync(user, request.RoleName);
            if (!addResult.Succeeded)
            {
                return BadRequest(new { errors = addResult.Errors.Select(x => x.Description).ToArray() });
            }
        }

        return Ok(await ToResponseAsync(user));
    }

    /// <summary>
    /// Soft deletes a user by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        user.IsActive = false;
        user.UpdateAt = DateTime.UtcNow;
        user.UserUpdateId = GetCurrentUserId();

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(x => x.Description).ToArray() });
        }

        return NoContent();
    }

    /// <summary>
    /// Resets a user password using system rule.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost("{uid:guid}/reset-password")]
    [ProducesResponseType(typeof(ResetPasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var generatedPassword = GenerateResetPassword(user.Name, DateTime.Now);
        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, generatedPassword);
        if (!resetResult.Succeeded)
        {
            return BadRequest(new { errors = resetResult.Errors.Select(x => x.Description).ToArray() });
        }

        user.UpdateAt = DateTime.UtcNow;
        user.UserUpdateId = GetCurrentUserId();
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(x => x.Description).ToArray() });
        }

        return Ok(new ResetPasswordResponse(generatedPassword));
    }

    private static string GenerateInitialPassword(string name, DateTime currentDate)
    {
        var firstLetter = GetFirstLetter(name);
        return $"{firstLetter}ana@{currentDate:MMdd}";
    }

    private static string GenerateResetPassword(string name, DateTime currentDate)
    {
        var firstLetter = GetFirstLetter(name);
        return $"{firstLetter}Mudar@{currentDate:MMdd}";
    }

    private static char GetFirstLetter(string name)
    {
        var trimmed = name?.Trim();
        return string.IsNullOrWhiteSpace(trimmed)
            ? 'A'
            : char.ToUpperInvariant(trimmed[0]);
    }

    private async Task<UserResponse> ToResponseAsync(AppUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new UserResponse(
            user.Uid,
            user.Name,
            user.Email ?? string.Empty,
            user.IsActive,
            user.CreateAt,
            user.UpdateAt,
            roles.ToList());
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
