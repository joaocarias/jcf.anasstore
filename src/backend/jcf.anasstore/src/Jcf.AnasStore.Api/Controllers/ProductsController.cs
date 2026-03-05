using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Products;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProductsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, [FromQuery] string? name, CancellationToken cancellationToken)
    {
        var filteredQuery = dbContext.Products
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var search = name.Trim();
            filteredQuery = filteredQuery.Where(x =>
                EF.Functions.ILike(x.Name, $"%{search}%") ||
                EF.Functions.ILike(x.Code, $"%{search}%"));
        }

        var total = await filteredQuery.CountAsync(cancellationToken);

        var products = await filteredQuery
            .Include(x => x.Supplier)
            .Include(x => x.Category)
            .Include(x => x.Colors)
            .Include(x => x.ItemSizes)
            .OrderBy(x => x.Name)
            .Skip((query.ValidPage - 1) * query.ValidPageSize)
            .Take(query.ValidPageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponse<ProductResponse>(
            products.Select(ToResponse).ToList(),
            total,
            query.ValidPage,
            query.ValidPageSize));
    }

    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(x => x.Supplier)
            .Include(x => x.Category)
            .Include(x => x.Colors)
            .Include(x => x.ItemSizes)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);

        return product is null ? NotFound() : Ok(ToResponse(product));
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var related = await LoadRelatedEntitiesAsync(
            request.SupplierUid,
            request.CategoryUid,
            request.ColorUids,
            request.ItemSizeUids,
            cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        try
        {
            var product = new Product(
                request.Code,
                request.Name,
                request.Description,
                related.Supplier!.Id,
                request.PurchasePrice,
                request.SalePrice,
                related.Category!.Id);

            product.SetColors(related.Colors);
            product.SetItemSizes(related.ItemSizes);

            if (!request.IsActive)
            {
                product.SetActive(false, GetCurrentUserId());
            }

            product.SetCreateUser(GetCurrentUserId());

            await dbContext.Products.AddAsync(product, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            product = await dbContext.Products
                .AsNoTracking()
                .Include(x => x.Supplier)
                .Include(x => x.Category)
                .Include(x => x.Colors)
                .Include(x => x.ItemSizes)
                .FirstAsync(x => x.Uid == product.Uid, cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = product.Uid }, ToResponse(product));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(x => x.Colors)
            .Include(x => x.ItemSizes)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var related = await LoadRelatedEntitiesAsync(
            request.SupplierUid,
            request.CategoryUid,
            request.ColorUids,
            request.ItemSizeUids,
            cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        try
        {
            product.Update(
                request.Code,
                request.Name,
                request.Description,
                related.Supplier!.Id,
                request.PurchasePrice,
                request.SalePrice,
                related.Category!.Id);

            product.SetColors(related.Colors);
            product.SetItemSizes(related.ItemSizes);

            if (request.IsActive.HasValue)
            {
                product.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                product.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            product = await dbContext.Products
                .AsNoTracking()
                .Include(x => x.Supplier)
                .Include(x => x.Category)
                .Include(x => x.Colors)
                .Include(x => x.ItemSizes)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            return Ok(ToResponse(product));
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
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<RelatedEntitiesResult> LoadRelatedEntitiesAsync(
        Guid supplierUid,
        Guid categoryUid,
        IReadOnlyCollection<Guid>? colorUids,
        IReadOnlyCollection<Guid>? itemSizeUids,
        CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == supplierUid, cancellationToken);
        if (supplier is null)
        {
            return RelatedEntitiesResult.Fail("SupplierUid is invalid.");
        }

        var category = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == categoryUid, cancellationToken);
        if (category is null)
        {
            return RelatedEntitiesResult.Fail("CategoryUid is invalid.");
        }

        var uniqueColorUids = (colorUids ?? []).Distinct().ToList();
        var colors = await dbContext.Colors
            .Where(x => uniqueColorUids.Contains(x.Uid))
            .ToListAsync(cancellationToken);
        if (colors.Count != uniqueColorUids.Count)
        {
            return RelatedEntitiesResult.Fail("One or more ColorUids are invalid.");
        }

        var uniqueItemSizeUids = (itemSizeUids ?? []).Distinct().ToList();
        var itemSizes = await dbContext.ItemSizes
            .Where(x => uniqueItemSizeUids.Contains(x.Uid))
            .ToListAsync(cancellationToken);
        if (itemSizes.Count != uniqueItemSizeUids.Count)
        {
            return RelatedEntitiesResult.Fail("One or more ItemSizeUids are invalid.");
        }

        return RelatedEntitiesResult.Ok(supplier, category, colors, itemSizes);
    }

    private static ProductResponse ToResponse(Product product)
    {
        if (product.Supplier is null)
        {
            throw new InvalidOperationException("Product supplier is not loaded.");
        }

        if (product.Category is null)
        {
            throw new InvalidOperationException("Product category is not loaded.");
        }

        return new ProductResponse(
            product.Uid,
            product.Code,
            product.Name,
            product.Description,
            product.Supplier.Uid,
            product.Supplier.Name,
            product.PurchasePrice,
            product.SalePrice,
            product.Category.Uid,
            product.Category.Name,
            product.Colors.Select(x => new ProductLookupResponse(x.Uid, x.Name)).ToList(),
            product.ItemSizes.Select(x => new ProductLookupResponse(x.Uid, x.Name)).ToList(),
            product.IsActive,
            product.CreateAt,
            product.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }

    private sealed record RelatedEntitiesResult(
        bool IsValid,
        string? ErrorMessage,
        Supplier? Supplier,
        Category? Category,
        List<Color> Colors,
        List<ItemSize> ItemSizes)
    {
        public static RelatedEntitiesResult Fail(string message) =>
            new(false, message, null, null, [], []);

        public static RelatedEntitiesResult Ok(Supplier supplier, Category category, List<Color> colors, List<ItemSize> itemSizes) =>
            new(true, null, supplier, category, colors, itemSizes);
    }
}
