using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Customers;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class CustomersController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lists all customers ordered by name.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<CustomerResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var total = await dbContext.Customers
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var customers = await dbContext.Customers
            .AsNoTracking()
            .Include(x => x.Genre)
            .Include(x => x.Address)
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<CustomerResponse>(
            customers.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    /// <summary>
    /// Gets a customer by uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var customer = await dbContext.Customers
            .AsNoTracking()
            .Include(x => x.Genre)
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return customer is null ? NotFound() : Ok(ToResponse(customer));
    }

    /// <summary>
    /// Creates a customer.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var genre = await dbContext.Genres
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Uid == request.GenreUid, cancellationToken);
            if (genre is null)
            {
                return BadRequest(new { message = "GenreUid is invalid." });
            }

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

            var customer = new Customer(
                request.Name,
                genre.Id,
                request.BirthDate,
                request.Phone,
                request.IsWhatsApp,
                address.Id);

            customer.SetCreateUser(GetCurrentUserId());

            await dbContext.Customers.AddAsync(customer, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            customer = await dbContext.Customers
                .AsNoTracking()
                .Include(x => x.Genre)
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == customer.Uid, cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = customer.Uid }, ToResponse(customer));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a customer by uid.
    /// </summary>
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var customer = await dbContext.Customers
            .Include(x => x.Genre)
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (customer is null)
        {
            return NotFound();
        }

        try
        {
            var genre = await dbContext.Genres
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Uid == request.GenreUid, cancellationToken);
            if (genre is null)
            {
                return BadRequest(new { message = "GenreUid is invalid." });
            }

            if (request.Address is null)
            {
                return BadRequest(new { message = "Address is required." });
            }

            customer.Address?.Update(
                request.Address.Place,
                request.Address.Number,
                request.Address.Neighborhood,
                request.Address.Complement,
                request.Address.ZipCode,
                request.Address.City,
                request.Address.State);

            customer.Update(
                request.Name,
                genre.Id,
                request.BirthDate,
                request.Phone,
                request.IsWhatsApp,
                customer.AddressId);

            if (request.IsActive.HasValue)
            {
                customer.SetActive(request.IsActive.Value, GetCurrentUserId());
                customer.Address?.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                customer.SetUpdate(GetCurrentUserId());
                customer.Address?.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            customer = await dbContext.Customers
                .AsNoTracking()
                .Include(x => x.Genre)
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            return Ok(ToResponse(customer));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a customer by uid.
    /// </summary>
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var customer = await dbContext.Customers.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (customer is null)
        {
            return NotFound();
        }

        customer.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static CustomerResponse ToResponse(Customer customer)
    {
        if (customer.Genre is null)
        {
            throw new InvalidOperationException("Customer genre is not loaded.");
        }

        if (customer.Address is null)
        {
            throw new InvalidOperationException("Customer address is not loaded.");
        }

        return new CustomerResponse(
            customer.Uid,
            customer.Name,
            customer.Genre.Uid,
            customer.Genre.Name,
            customer.BirthDate,
            customer.Phone,
            customer.IsWhatsApp,
            customer.Address.Uid,
            customer.Address.Place,
            customer.Address.Number,
            customer.Address.Neighborhood,
            customer.Address.Complement,
            customer.Address.ZipCode,
            customer.Address.City,
            customer.Address.State,
            customer.IsActive,
            customer.CreateAt,
            customer.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
