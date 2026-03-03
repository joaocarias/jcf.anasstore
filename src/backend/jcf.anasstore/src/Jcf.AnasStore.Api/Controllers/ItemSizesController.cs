using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.ItemSizes;
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
public sealed class ItemSizesController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all item sizes ordered by order.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ItemSizeResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await dbContext.ItemSizes
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var itemSizes = await dbContext.ItemSizes
            .AsNoTracking()
            .OrderBy(x => x.Order)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<ItemSizeResponse>(
            itemSizes.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets an item size by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(ItemSizeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var itemSize = await dbContext.ItemSizes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return itemSize is null ? NotFound() : Ok(ToResponse(itemSize));
    }

    /// <summary>
    /// Creates an item size.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(ItemSizeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateItemSizeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var itemSize = new ItemSize(request.Name, request.Description, request.Order);
            if (!request.IsActive)
            {
                itemSize.SetActive(false, GetCurrentUserId());
            }

            itemSize.SetCreateUser(GetCurrentUserId());

            await dbContext.ItemSizes.AddAsync(itemSize, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = itemSize.Uid }, ToResponse(itemSize));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an item size by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(ItemSizeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateItemSizeRequest request, CancellationToken cancellationToken)
    {
        var itemSize = await dbContext.ItemSizes.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (itemSize is null)
        {
            return NotFound();
        }

        try
        {
            itemSize.Update(request.Name, request.Description, request.Order);
            if (request.IsActive.HasValue)
            {
                itemSize.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                itemSize.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(itemSize));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes an item size by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var itemSize = await dbContext.ItemSizes.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (itemSize is null)
        {
            return NotFound();
        }

        itemSize.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static ItemSizeResponse ToResponse(ItemSize itemSize)
    {
        return new ItemSizeResponse(
            itemSize.Uid,
            itemSize.Name,
            itemSize.Description,
            itemSize.Order,
            itemSize.IsActive,
            itemSize.CreateAt,
            itemSize.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
