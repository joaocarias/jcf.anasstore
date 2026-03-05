using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Suppliers;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class SuppliersController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all suppliers ordered by name.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SupplierResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, [FromQuery] string? name, CancellationToken cancellationToken)
    {
        var filteredQuery = dbContext.Suppliers
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var search = name.Trim();
            filteredQuery = filteredQuery.Where(x => EF.Functions.ILike(x.Name, $"%{search}%"));
        }

        var total = await filteredQuery.CountAsync(cancellationToken);

        var suppliers = await filteredQuery
            .Include(x => x.Address)
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<SupplierResponse>(
            suppliers.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a supplier by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers
            .AsNoTracking()
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return supplier is null ? NotFound() : Ok(ToResponse(supplier));
    }

    /// <summary>
    /// Creates a supplier.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.Address is null)
            {
                return BadRequest(new { message = "Address is required." });
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

            var address = new Address(
                request.Address.Place,
                request.Address.Number,
                request.Address.Neighborhood,
                request.Address.Complement,
                request.Address.ZipCode,
                request.Address.City,
                request.Address.State);
            address.SetCreateUser(GetCurrentUserId());

            await dbContext.Addresses.AddAsync(address, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var supplier = new Supplier(request.Name, request.Phone, request.Email, request.IsWhatsApp, address.Id);
            supplier.SetCreateUser(GetCurrentUserId());

            await dbContext.Suppliers.AddAsync(supplier, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            supplier = await dbContext.Suppliers
                .AsNoTracking()
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == supplier.Uid, cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = supplier.Uid }, ToResponse(supplier));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a supplier by uid.
    /// </summary>
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateSupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (supplier is null)
        {
            return NotFound();
        }

        try
        {
            if (request.Address is null)
            {
                return BadRequest(new { message = "Address is required." });
            }

            supplier.Address?.Update(
                request.Address.Place,
                request.Address.Number,
                request.Address.Neighborhood,
                request.Address.Complement,
                request.Address.ZipCode,
                request.Address.City,
                request.Address.State);

            supplier.Update(request.Name, request.Phone, request.Email, request.IsWhatsApp, supplier.AddressId);
            if (request.IsActive.HasValue)
            {
                supplier.SetActive(request.IsActive.Value, GetCurrentUserId());
                supplier.Address?.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                supplier.SetUpdate(GetCurrentUserId());
                supplier.Address?.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            supplier = await dbContext.Suppliers
                .AsNoTracking()
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            return Ok(ToResponse(supplier));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a supplier by uid.
    /// </summary>
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (supplier is null)
        {
            return NotFound();
        }

        supplier.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static SupplierResponse ToResponse(Supplier supplier)
    {
        if (supplier.Address is null)
        {
            throw new InvalidOperationException("Supplier address is not loaded.");
        }

        return new SupplierResponse(
            supplier.Uid,
            supplier.Name,
            supplier.Phone,
            supplier.Email,
            supplier.IsWhatsApp,
            supplier.AddressId,
            supplier.Address.Uid,
            supplier.Address.Place,
            supplier.Address.Number,
            supplier.Address.Neighborhood,
            supplier.Address.Complement,
            supplier.Address.ZipCode,
            supplier.Address.City,
            supplier.Address.State,
            supplier.IsActive,
            supplier.CreateAt,
            supplier.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
