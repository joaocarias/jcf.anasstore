using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Sales;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
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
        var saleUid = await commandDispatcher.SendAsync<CreateSaleCommand, Guid>(
            new CreateSaleCommand(request.CustomerEmail, request.TotalAmount),
            cancellationToken);

        return CreatedAtAction(nameof(GetRecent), new { page = 1, pageSize = 1 }, new { uid = saleUid });
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
}
