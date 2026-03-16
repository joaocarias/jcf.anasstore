using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Sales;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
using Jcf.AnasStore.Application.Features.Sales.GetSaleById;
using Jcf.AnasStore.Application.Features.Sales.GetSalesHistory;
using Jcf.AnasStore.Application.Features.Sales.GetRecentSales;
using Jcf.AnasStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class SalesController(
    ICommandDispatcher commandDispatcher,
    IQueryDispatcher queryDispatcher,
    AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Registra uma nova venda no sistema.
    /// </summary>
    /// <param name="request">Dados da venda.</param>
    /// <param name="cancellationToken">Token de cancelamento da requisicao.</param>
    /// <returns>Uid da venda criada.</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var items = request.Items
                .Select(item => new CreateSaleItem(item.ProductVariationUid, item.Quantity))
                .ToList();

            var saleUid = await commandDispatcher.SendAsync<CreateSaleCommand, Guid>(
                new CreateSaleCommand(
                    request.CustomerUid,
                    request.PaymentMethodUid,
                    request.Installments,
                    request.DiscountAmount,
                    items,
                    GetCurrentUserId()),
                cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = saleUid }, new { uid = saleUid });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(SaleDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var sale = await queryDispatcher.SendAsync<GetSaleByIdQuery, SaleDetailDto?>(
            new GetSaleByIdQuery(uid),
            cancellationToken);

        if (sale is null)
        {
            return NotFound();
        }

        var response = new SaleDetailResponse(
            sale.Uid,
            sale.CustomerName,
            sale.CustomerPhone,
            sale.CustomerIsWhatsApp,
            sale.PaymentMethodName,
            sale.Installments,
            sale.SubtotalAmount,
            sale.DiscountAmount,
            sale.TotalAmount,
            sale.Items
                .Select(item => new SaleItemResponse(
                    item.ProductVariationUid,
                    item.ProductName,
                    item.ColorName,
                    item.ItemSizeName,
                    item.Quantity,
                    item.UnitPrice,
                    item.TotalAmount))
                .ToList());

        return Ok(response);
    }

    /// <summary>
    /// Retorna as vendas mais recentes.
    /// </summary>
    /// <param name="query">Dados da paginacao.</param>
    /// <param name="cancellationToken">Token de cancelamento da requisicao.</param>
    /// <returns>Lista paginada de vendas recentes.</returns>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(PagedResponse<SaleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecent([FromQuery] PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var total = await dbContext.Sales.AsNoTracking().CountAsync(cancellationToken);
        var take = query.ValidPage * query.ValidPageSize;

        var sales = await queryDispatcher.SendAsync<GetRecentSalesQuery, IReadOnlyList<SaleSummaryDto>>(
            new GetRecentSalesQuery(take),
            cancellationToken);

        var items = sales
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToList();

        return Ok(new PagedResponse<SaleSummaryDto>(items, total, query.ValidPage, query.ValidPageSize));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SaleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] PaginationQuery query,
        [FromQuery] Guid? customerUid,
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var result = await queryDispatcher.SendAsync<GetSalesHistoryQuery, PagedReadResult<SaleSummaryDto>>(
            new GetSalesHistoryQuery(query.ValidPage, query.ValidPageSize, customerUid, startDate, endDate),
            cancellationToken);

        return Ok(new PagedResponse<SaleSummaryDto>(
            result.Items,
            result.Total,
            query.ValidPage,
            query.ValidPageSize));
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }
}
