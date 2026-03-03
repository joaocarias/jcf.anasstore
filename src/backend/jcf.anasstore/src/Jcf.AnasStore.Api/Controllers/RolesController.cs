using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Roles.Common;
using Jcf.AnasStore.Application.Features.Roles.GetAllRoles;
using Jcf.AnasStore.Application.Features.Roles.GetRoleById;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize(Roles = IdentitySeeder.AdminRoleName)]
[Route("api/[controller]")]
public sealed class RolesController(IQueryDispatcher queryDispatcher) : ControllerBase
{
    /// <summary>
    /// Lists all roles registered in the system.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var roles = await queryDispatcher.SendAsync<GetAllRolesQuery, IReadOnlyList<RoleDto>>(
            new GetAllRolesQuery(),
            cancellationToken);

        var total = roles.Count;
        var items = roles
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToList();

        return Ok(new PagedResponse<RoleDto>(items, total, query.ValidPage, query.ValidPageSize));
    }

    /// <summary>
    /// Gets a specific role by its uid.
    /// </summary>
    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var role = await queryDispatcher.SendAsync<GetRoleByIdQuery, RoleDto?>(
            new GetRoleByIdQuery(uid),
            cancellationToken);

        return role is null ? NotFound() : Ok(role);
    }
}
