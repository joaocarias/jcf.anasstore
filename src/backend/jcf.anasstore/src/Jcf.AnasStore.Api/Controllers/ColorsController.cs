using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Colors;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ColorsController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all colors ordered by name.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ColorResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await dbContext.Colors
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var colors = await dbContext.Colors
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<ColorResponse>(
            colors.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a color by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(ColorResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var color = await dbContext.Colors
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return color is null ? NotFound() : Ok(ToResponse(color));
    }

    /// <summary>
    /// Creates a color.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(ColorResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateColorRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var color = new Color(request.Name, request.Description);
            if (!request.IsActive)
            {
                color.SetActive(false, GetCurrentUserId());
            }

            color.SetCreateUser(GetCurrentUserId());

            await dbContext.Colors.AddAsync(color, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = color.Uid }, ToResponse(color));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a color by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(ColorResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateColorRequest request, CancellationToken cancellationToken)
    {
        var color = await dbContext.Colors.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (color is null)
        {
            return NotFound();
        }

        try
        {
            color.Update(request.Name, request.Description);
            if (request.IsActive.HasValue)
            {
                color.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                color.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(color));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a color by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var color = await dbContext.Colors.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (color is null)
        {
            return NotFound();
        }

        color.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static ColorResponse ToResponse(Color color)
    {
        return new ColorResponse(
            color.Uid,
            color.Name,
            color.Description,
            color.IsActive,
            color.CreateAt,
            color.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
