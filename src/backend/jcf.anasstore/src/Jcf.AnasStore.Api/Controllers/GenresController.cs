using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Genres;
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
public sealed class GenresController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all genres.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<GenreResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await dbContext.Genres
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var genres = await dbContext.Genres
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<GenreResponse>(
            genres.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a genre by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(GenreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var genre = await dbContext.Genres
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return genre is null ? NotFound() : Ok(ToResponse(genre));
    }

    /// <summary>
    /// Creates a genre.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(GenreResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateGenreRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var genre = new Genre(request.Name, request.Description);
            if (!request.IsActive)
            {
                genre.SetActive(false, GetCurrentUserId());
            }

            genre.SetCreateUser(GetCurrentUserId());

            await dbContext.Genres.AddAsync(genre, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = genre.Uid }, ToResponse(genre));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a genre by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(GenreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateGenreRequest request, CancellationToken cancellationToken)
    {
        var genre = await dbContext.Genres.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (genre is null)
        {
            return NotFound();
        }

        try
        {
            genre.Update(request.Name, request.Description);
            if (request.IsActive.HasValue)
            {
                genre.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                genre.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(genre));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a genre by uid.
    /// </summary>
    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var genre = await dbContext.Genres.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (genre is null)
        {
            return NotFound();
        }

        genre.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static GenreResponse ToResponse(Genre genre)
    {
        return new GenreResponse(
            genre.Uid,
            genre.Name,
            genre.Description,
            genre.IsActive,
            genre.CreateAt,
            genre.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
