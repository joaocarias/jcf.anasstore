namespace Jcf.AnasStore.Application.Abstractions.Data;

public interface ILabelService
{
    byte[] GenerateLabelsPdf(List<ProductLabelDto> labels);
    List<ProductLabelDto> ParseCsv(Stream csvStream);
}
