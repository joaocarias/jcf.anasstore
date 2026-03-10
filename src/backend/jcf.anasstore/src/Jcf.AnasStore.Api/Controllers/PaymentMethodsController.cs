using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.PaymentMethods;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;
using Jcf.AnasStore.Application.Features.PaymentMethods.CreatePaymentMethod;
using Jcf.AnasStore.Application.Features.PaymentMethods.DeletePaymentMethod;
using Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethodById;
using Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethods;
using Jcf.AnasStore.Application.Features.PaymentMethods.UpdatePaymentMethod;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class PaymentMethodsController(ICommandDispatcher commandDispatcher, IQueryDispatcher queryDispatcher) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<PaymentMethodResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var result = await queryDispatcher.SendAsync<GetPaymentMethodsQuery, PagedReadResult<PaymentMethodReadDto>>(
            new GetPaymentMethodsQuery(query.ValidPage, query.ValidPageSize),
            cancellationToken);

        return Ok(new PagedResponse<PaymentMethodResponse>(
            result.Items.Select(ToResponse).ToList(),
            result.Total,
            query.ValidPage,
            query.ValidPageSize));
    }

    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(PaymentMethodResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var paymentMethod = await queryDispatcher.SendAsync<GetPaymentMethodByIdQuery, PaymentMethodReadDto?>(
            new GetPaymentMethodByIdQuery(uid),
            cancellationToken);

        return paymentMethod is null ? NotFound() : Ok(ToResponse(paymentMethod));
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(PaymentMethodResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePaymentMethodRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await commandDispatcher.SendAsync<CreatePaymentMethodCommand, PaymentMethodReadDto>(
                new CreatePaymentMethodCommand(
                    request.Name,
                    request.Description,
                    request.DiscountPercentage,
                    request.MaxInstallments,
                    request.DisplayOrder,
                    request.IsActive,
                    GetCurrentUserId()),
                cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = created.Uid }, ToResponse(created));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(PaymentMethodResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdatePaymentMethodRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await commandDispatcher.SendAsync<UpdatePaymentMethodCommand, PaymentMethodReadDto?>(
                new UpdatePaymentMethodCommand(
                    uid,
                    request.Name,
                    request.Description,
                    request.DiscountPercentage,
                    request.MaxInstallments,
                    request.DisplayOrder,
                    request.IsActive,
                    GetCurrentUserId()),
                cancellationToken);

            return updated is null ? NotFound() : Ok(ToResponse(updated));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var deleted = await commandDispatcher.SendAsync<DeletePaymentMethodCommand, bool>(
            new DeletePaymentMethodCommand(uid, GetCurrentUserId()),
            cancellationToken);

        return deleted ? NoContent() : NotFound();
    }

    private static PaymentMethodResponse ToResponse(PaymentMethodReadDto dto)
    {
        return new PaymentMethodResponse(
            dto.Uid,
            dto.Name,
            dto.Description,
            dto.DiscountPercentage,
            dto.MaxInstallments,
            dto.DisplayOrder,
            dto.IsActive,
            dto.CreateAt,
            dto.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
