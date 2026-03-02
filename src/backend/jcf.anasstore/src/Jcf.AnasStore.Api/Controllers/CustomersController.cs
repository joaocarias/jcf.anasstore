using System.Security.Claims;
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
    [ProducesResponseType(typeof(IReadOnlyList<CustomerResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var customers = await dbContext.Customers
            .AsNoTracking()
            .Include(x => x.Genre)
            .Include(x => x.Address)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(customers.Select(ToResponse).ToList());
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
                .FirstOrDefaultAsync(x => x.Id == request.GenreId, cancellationToken);
            if (genre is null)
            {
                return BadRequest(new { message = "GenreId is invalid." });
            }

            var address = await dbContext.Addresses
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.AddressId, cancellationToken);
            if (address is null)
            {
                return BadRequest(new { message = "AddressId is invalid." });
            }

            var customer = new Customer(
                request.Name,
                request.GenreId,
                request.BirthDate,
                request.Phone,
                request.IsWhatsApp,
                request.AddressId);

            if (!request.IsActive)
            {
                customer.SetActive(false, GetCurrentUserId());
            }

            customer.SetCreateUser(GetCurrentUserId());

            await dbContext.Customers.AddAsync(customer, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

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
            var genreExists = await dbContext.Genres
                .AsNoTracking()
                .AnyAsync(x => x.Id == request.GenreId, cancellationToken);
            if (!genreExists)
            {
                return BadRequest(new { message = "GenreId is invalid." });
            }

            var addressExists = await dbContext.Addresses
                .AsNoTracking()
                .AnyAsync(x => x.Id == request.AddressId, cancellationToken);
            if (!addressExists)
            {
                return BadRequest(new { message = "AddressId is invalid." });
            }

            customer.Update(
                request.Name,
                request.GenreId,
                request.BirthDate,
                request.Phone,
                request.IsWhatsApp,
                request.AddressId);

            if (request.IsActive.HasValue)
            {
                customer.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                customer.SetUpdate(GetCurrentUserId());
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
