using Jcf.AnasStore.Api.Contracts.Sales;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
using Jcf.AnasStore.Application.Features.Sales.GetRecentSales;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class SalesController(ICommandDispatcher commandDispatcher, IQueryDispatcher queryDispatcher) : ControllerBase
{
    /// <summary>
    /// Registra uma nova venda no sistema.
    /// </summary>
    /// <param name="request">Dados da venda.</param>
    /// <param name="cancellationToken">Token de cancelamento da requisição.</param>
    /// <returns>Uid da venda criada.</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest request, CancellationToken cancellationToken)
    {
        var saleUid = await commandDispatcher.SendAsync<CreateSaleCommand, Guid>(
            new CreateSaleCommand(request.CustomerEmail, request.TotalAmount),
            cancellationToken);

        return CreatedAtAction(nameof(GetRecent), new { take = 1 }, new { uid = saleUid });
    }

    /// <summary>
    /// Retorna as vendas mais recentes.
    /// </summary>
    /// <param name="take">Quantidade de registros retornados.</param>
    /// <param name="cancellationToken">Token de cancelamento da requisição.</param>
    /// <returns>Lista de vendas recentes.</returns>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(IReadOnlyList<SaleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecent([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var sales = await queryDispatcher.SendAsync<GetRecentSalesQuery, IReadOnlyList<SaleSummaryDto>>(
            new GetRecentSalesQuery(take),
            cancellationToken);

        return Ok(sales);
    }
}
