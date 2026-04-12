using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using Jcf.AnasStore.Application.Abstractions.Data;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace Jcf.AnasStore.Application.Services.Labels;

public sealed class LabelService : ILabelService
{
    private const float LabelWidthMm      = 26.0f;
    private const float LabelHeightMm     = 15.0f;
    private const float HGapMm            = 2.0f;   // espaço horizontal entre etiquetas
    private const int   LabelsPerRow      = 7;
    private const int   RowsPerHalf       = 9;       // 18 linhas totais / 2 metades
    private const float LeftMarginMm      = 8.0f;
    private const float RightMarginMm     = 8.0f;
    private const float TopMarginMm       = 13.0f;
    private const float PageWidthMm       = 210f;
    private const float PageHeightMm      = 297f;

    public byte[] GenerateLabelsPdf(List<ProductLabelDto> labels)
    {
        if (labels == null || labels.Count == 0)
            throw new ArgumentException("Labels list cannot be empty.", nameof(labels));

        QuestPDF.Settings.License = LicenseType.Community;

        var expandedLabels = ExpandByQuantity(labels);

        int pageSize = LabelsPerRow * RowsPerHalf;
        var pages = Enumerable.Range(0, (int)Math.Ceiling((double)expandedLabels.Count / pageSize))
            .Select(i => expandedLabels.Skip(i * pageSize).Take(pageSize).ToList())
            .ToList();

        var document = Document.Create(container =>
        {
            foreach (var pageLabels in pages)
                container.Page(page => RenderPage(page, pageLabels));
        });

        return document.GeneratePdf();
    }

    public List<ProductLabelDto> ParseCsv(Stream csvStream)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ",",
            HeaderValidated = null,
            PrepareHeaderForMatch = args => args.Header.ToLowerInvariant(),
            MissingFieldFound = null,
        };

        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        using var csv = new CsvReader(reader, config);

        return csv.GetRecords<CsvLabelRecord>()
            .Select(r =>
            {
                ValidateRecord(r);
                return new ProductLabelDto(
                    Reference: r.Referencia?.Trim() ?? "",
                    Name: r.Nome?.Trim() ?? "",
                    Price: r.Preço,
                    Quantity: r.Quantidade);
            })
            .ToList();
    }

    private static List<ProductLabelDto> ExpandByQuantity(List<ProductLabelDto> labels)
    {
        var expanded = new List<ProductLabelDto>();
        foreach (var label in labels)
        {
            for (int i = 0; i < label.Quantity; i++)
                expanded.Add(label);
        }
        return expanded;
    }

    private static void ValidateRecord(CsvLabelRecord record)
    {
        if (string.IsNullOrWhiteSpace(record.Referencia))
            throw new ArgumentException("Campo 'referencia' é obrigatório.");
        if (string.IsNullOrWhiteSpace(record.Nome))
            throw new ArgumentException("Campo 'nome' é obrigatório.");
        if (record.Preço <= 0)
            throw new ArgumentException("Campo 'preço' deve ser maior que zero.");
        if (record.Quantidade <= 0)
            throw new ArgumentException("Campo 'quantidade' deve ser maior que zero.");
    }

    private static void RenderPage(PageDescriptor page, List<ProductLabelDto> labels)
    {
        page.Size(PageWidthMm, PageHeightMm, Unit.Millimetre);
        page.Margin(0);

        int totalRows = (int)Math.Ceiling((double)labels.Count / LabelsPerRow);

        page.Content()
            .PaddingTop(TopMarginMm, Unit.Millimetre)
            .PaddingLeft(LeftMarginMm, Unit.Millimetre)
            .PaddingRight(RightMarginMm, Unit.Millimetre)
            .Column(column =>
            {
                column.Spacing(0);
                RenderLabelsGrid(column, labels, totalRows);
                RenderLabelsGrid(column, labels, totalRows);
            });
    }

    private static void RenderLabelsGrid(
        ColumnDescriptor column,
        List<ProductLabelDto> labels,
        int totalRows)
    {
        for (int row = 0; row < totalRows; row++)
        {
            column.Item().Row(rowDescriptor =>
            {
                rowDescriptor.Spacing(HGapMm, Unit.Millimetre);

                for (int col = 0; col < LabelsPerRow; col++)
                {
                    int index = row * LabelsPerRow + col;
                    var label = index < labels.Count ? labels[index] : null;

                    rowDescriptor.ConstantItem(LabelWidthMm, Unit.Millimetre)
                        .Height(LabelHeightMm, Unit.Millimetre)
                        .Padding(1.0f)
                        .DefaultTextStyle(x => x.FontSize(6).FontColor("#000000"))
                        .Column(labelColumn =>
                        {
                            if (label != null)
                            {
                                labelColumn.Item().AlignCenter().Text($"Ref: {label.Reference}");
                                labelColumn.Item().Text(text =>
                                {
                                    text.AlignCenter();
                                    text.DefaultTextStyle(t => t.FontSize(5).LineHeight(1.1f));
                                    text.Span(label.Name);
                                });
                                labelColumn.Item().AlignCenter().Text($"R$ {label.Price:F2}");
                            }
                        });
                }
            });
        }
    }
}
