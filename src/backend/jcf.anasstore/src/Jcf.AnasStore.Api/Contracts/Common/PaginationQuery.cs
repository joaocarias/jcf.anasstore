namespace Jcf.AnasStore.Api.Contracts.Common;

public sealed record PaginationQuery(int Page = 1, int PageSize = 10)
{
    public int ValidPage => Page < 1 ? 1 : Page;

    public int ValidPageSize
    {
        get
        {
            if (PageSize < 1)
            {
                return 10;
            }

            return PageSize > 100 ? 100 : PageSize;
        }
    }
}
