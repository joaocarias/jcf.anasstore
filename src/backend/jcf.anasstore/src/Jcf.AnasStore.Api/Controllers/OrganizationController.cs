using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Organization;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class OrganizationController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Gets the organization data when it exists.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var organization = await dbContext.Organizations
            .AsNoTracking()
            .Include(x => x.Address)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return organization is null ? NotFound() : Ok(ToResponse(organization));
    }

    /// <summary>
    /// Creates the organization when none exists.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var exists = await dbContext.Organizations.AsNoTracking().AnyAsync(cancellationToken);
            if (exists)
            {
                return Conflict(new { message = "Organization already exists." });
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

            var organization = new Organization(
                request.LegalName,
                request.TradeName,
                request.Cnpj,
                request.Phone,
                request.Email,
                request.OpeningDate,
                request.Cnae,
                request.StateRegistration,
                request.Administrator,
                address.Id);
            organization.SetCreateUser(GetCurrentUserId());

            await dbContext.Organizations.AddAsync(organization, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            organization = await dbContext.Organizations
                .AsNoTracking()
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == organization.Uid, cancellationToken);

            return CreatedAtAction(nameof(Get), routeValues: null, ToResponse(organization));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates the organization data.
    /// </summary>
    [HttpPut("{uid:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateOrganizationRequest request, CancellationToken cancellationToken)
    {
        var organization = await dbContext.Organizations
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (organization is null)
        {
            return NotFound();
        }

        try
        {
            if (request.Address is null)
            {
                return BadRequest(new { message = "Address is required." });
            }

            organization.Address?.Update(
                request.Address.Place,
                request.Address.Number,
                request.Address.Neighborhood,
                request.Address.Complement,
                request.Address.ZipCode,
                request.Address.City,
                request.Address.State);

            organization.Update(
                request.LegalName,
                request.TradeName,
                request.Cnpj,
                request.Phone,
                request.Email,
                request.OpeningDate,
                request.Cnae,
                request.StateRegistration,
                request.Administrator,
                organization.AddressId);

            organization.SetUpdate(GetCurrentUserId());
            organization.Address?.SetUpdate(GetCurrentUserId());

            await dbContext.SaveChangesAsync(cancellationToken);

            organization = await dbContext.Organizations
                .AsNoTracking()
                .Include(x => x.Address)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            return Ok(ToResponse(organization));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static OrganizationResponse ToResponse(Organization organization)
    {
        if (organization.Address is null)
        {
            throw new InvalidOperationException("Organization address is not loaded.");
        }

        return new OrganizationResponse(
            organization.Uid,
            organization.LegalName,
            organization.TradeName,
            organization.Cnpj,
            organization.Phone,
            organization.Email,
            organization.OpeningDate,
            organization.Cnae,
            organization.StateRegistration,
            organization.Administrator,
            organization.AddressId,
            organization.Address.Uid,
            organization.Address.Place,
            organization.Address.Number,
            organization.Address.Neighborhood,
            organization.Address.Complement,
            organization.Address.ZipCode,
            organization.Address.City,
            organization.Address.State,
            organization.IsActive,
            organization.CreateAt,
            organization.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
