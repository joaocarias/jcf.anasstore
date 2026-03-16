using Jcf.AnasStore.Api.Contracts.Dashboard;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Dashboard.Common;
using Jcf.AnasStore.Application.Features.Dashboard.GetDashboardSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DashboardController(IQueryDispatcher queryDispatcher) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int latestSales = 5,
        [FromQuery] int latestProducts = 5,
        CancellationToken cancellationToken = default)
    {
        var summary = await queryDispatcher.SendAsync<GetDashboardSummaryQuery, DashboardSummaryDto>(
            new GetDashboardSummaryQuery(latestSales, latestProducts),
            cancellationToken);

        return Ok(new DashboardSummaryResponse(
            summary.DailyRevenue,
            summary.MonthlyRevenue,
            summary.DailySales,
            summary.StockItems,
            summary.LatestSales,
            summary.LatestProducts));
    }
}
