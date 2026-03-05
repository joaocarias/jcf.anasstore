using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Categories;
using Jcf.AnasStore.Api.Contracts.Common;
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
public sealed class CategoriesController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all categories ordered by name.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await dbContext.Categories
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var categories = await dbContext.Categories
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<CategoryResponse>(
            categories.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a category by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return category is null ? NotFound() : Ok(ToResponse(category));
    }

    /// <summary>
    /// Creates a category.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var category = new Category(request.Name, request.Description);
            if (!request.IsActive)
            {
                category.SetActive(false, GetCurrentUserId());
            }

            category.SetCreateUser(GetCurrentUserId());

            await dbContext.Categories.AddAsync(category, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = category.Uid }, ToResponse(category));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a category by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        try
        {
            category.Update(request.Name, request.Description);
            if (request.IsActive.HasValue)
            {
                category.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                category.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(category));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a category by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static CategoryResponse ToResponse(Category category)
    {
        return new CategoryResponse(
            category.Uid,
            category.Name,
            category.Description,
            category.IsActive,
            category.CreateAt,
            category.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
