import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_BLUE = [37, 99, 235]
const GRAY_LINE = [229, 231, 235]
const GRAY_TEXT = [107, 114, 128]

/**
 * Builds the standard PDF header with company data and returns the Y position after it.
 * @param {jsPDF} doc
 * @param {object|null} organization
 * @param {string} reportTitle
 * @returns {number} Y position after the header
 */
export function buildPdfHeader(doc, organization, reportTitle) {
  const pageWidth = doc.internal.pageSize.width
  const tradeName = organization?.tradeName || "Ana's Store"
  const legalName = organization?.legalName
  const cnpj = organization?.cnpj
  const phone = organization?.phone
  const email = organization?.email
  const city = organization?.city
  const state = organization?.state

  // Brand color accent bar
  doc.setFillColor(...BRAND_BLUE)
  doc.rect(0, 0, pageWidth, 8, 'F')

  // Company trade name
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(tradeName, 14, 20)

  // Secondary company details (left column)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  let leftY = 27
  if (legalName && legalName !== tradeName) {
    doc.text(legalName, 14, leftY)
    leftY += 5
  }
  if (cnpj) {
    doc.text(`CNPJ: ${cnpj}`, 14, leftY)
    leftY += 5
  }
  if (phone) {
    doc.text(`Telefone: ${phone}`, 14, leftY)
    leftY += 5
  }
  if (email) {
    doc.text(`E-mail: ${email}`, 14, leftY)
    leftY += 5
  }
  if (city || state) {
    doc.text([city, state].filter(Boolean).join(' - '), 14, leftY)
    leftY += 5
  }

  // Report title (right side)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_BLUE)
  doc.text(reportTitle, pageWidth - 14, 20, { align: 'right' })

  // Generation date (right side)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - 14, 27, { align: 'right' })

  // Separator line
  const headerBottom = Math.max(leftY, 32)
  doc.setDrawColor(...GRAY_LINE)
  doc.setLineWidth(0.5)
  doc.line(14, headerBottom, pageWidth - 14, headerBottom)

  doc.setTextColor(30, 41, 59)
  return headerBottom + 6
}

/**
 * Adds a summary row of key-value metrics below the header.
 * @param {jsPDF} doc
 * @param {number} startY
 * @param {Array<{label: string, value: string}>} metrics
 * @returns {number} Y position after the metrics row
 */
export function addSummaryMetrics(doc, startY, metrics) {
  const pageWidth = doc.internal.pageSize.width
  const boxW = (pageWidth - 28 - (metrics.length - 1) * 4) / metrics.length
  let x = 14

  metrics.forEach(({ label, value }) => {
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, startY, boxW, 16, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_TEXT)
    doc.text(label, x + boxW / 2, startY + 5, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(String(value), x + boxW / 2, startY + 12, { align: 'center' })

    x += boxW + 4
  })

  doc.setTextColor(30, 41, 59)
  return startY + 22
}

/**
 * Formats a decimal number as BRL currency.
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Formats a decimal as a percentage string.
 */
export function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`
}

/**
 * Generates a PDF for the Sales Report.
 */
export function exportSalesReportPdf(organization, report, filters) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  let y = buildPdfHeader(doc, organization, 'Relatório de Vendas de Produtos')

  // Filter summary
  if (filters.startDate || filters.endDate || filters.sellerName) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY_TEXT)
    const parts = []
    if (filters.startDate) parts.push(`De: ${filters.startDate}`)
    if (filters.endDate) parts.push(`Até: ${filters.endDate}`)
    if (filters.sellerName) parts.push(`Vendedor: ${filters.sellerName}`)
    doc.text(parts.join('   |   '), 14, y)
    y += 6
  }

  y = addSummaryMetrics(doc, y, [
    { label: 'Total de Vendas', value: String(report.totalSales) },
    { label: 'Peças Vendidas', value: String(report.totalQuantity) },
    { label: 'Faturamento Bruto', value: formatCurrency(report.totalRevenue + report.totalDiscounts) },
    { label: 'Descontos', value: formatCurrency(report.totalDiscounts) },
    { label: 'Faturamento Líquido', value: formatCurrency(report.totalRevenue) },
    {
      label: 'Ticket Médio',
      value: report.totalSales > 0 ? formatCurrency(report.totalRevenue / report.totalSales) : 'R$ 0,00',
    },
  ])

  autoTable(doc, {
    startY: y + 2,
    head: [['Data/Hora', 'Produto', 'Cor', 'Tamanho', 'Cód.', 'Qtde', 'Vlr. Unit.', 'Total', 'Cliente', 'Pagamento', 'Vendedor']],
    body: report.items.map((item) => [
      new Date(item.saleDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      item.productName,
      item.colorName,
      item.sizeName,
      item.variationCode || '-',
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalAmount),
      item.customerName,
      item.paymentMethodName,
      item.sellerName,
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 24 },
      5: { halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    didDrawPage: (data) => {
      addPageFooter(doc, data.pageNumber)
    },
  })

  doc.save(`relatorio-vendas-${formatFileDate()}.pdf`)
}

/**
 * Generates a PDF for the ABC Report.
 */
export function exportAbcReportPdf(organization, items, filters) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = buildPdfHeader(doc, organization, 'Relatório ABC de Produtos')

  if (filters.startDate || filters.endDate) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY_TEXT)
    const parts = []
    if (filters.startDate) parts.push(`De: ${filters.startDate}`)
    if (filters.endDate) parts.push(`Até: ${filters.endDate}`)
    doc.text(parts.join('   |   '), 14, y)
    y += 6
  }

  const classA = items.filter((i) => i.abcClass === 'A')
  const classB = items.filter((i) => i.abcClass === 'B')
  const classC = items.filter((i) => i.abcClass === 'C')
  const totalRevenue = items.reduce((s, i) => s + i.totalRevenue, 0)

  y = addSummaryMetrics(doc, y, [
    { label: 'Total de Produtos', value: String(items.length) },
    { label: 'Classe A (produtos)', value: String(classA.length) },
    { label: 'Classe B (produtos)', value: String(classB.length) },
    { label: 'Classe C (produtos)', value: String(classC.length) },
    { label: 'Faturamento Total', value: formatCurrency(totalRevenue) },
  ])

  // Legend
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  doc.text(
    'Classe A: 20% dos produtos com 80% do faturamento  |  Classe B: 30% com 15%  |  Classe C: 50% com 5%',
    14,
    y,
  )
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['#', 'Produto', 'Qtde Vendida', 'Faturamento', '% Fat.', '% Acum.', 'Classe']],
    body: items.map((item) => [
      item.rank,
      item.productName,
      item.totalQuantity,
      formatCurrency(item.totalRevenue),
      formatPercent(item.revenuePercentage),
      formatPercent(item.cumulativePercentage),
      item.abcClass,
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', cellWidth: 15 },
    },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const cls = data.cell.text[0]
        if (cls === 'A') data.cell.styles.textColor = [22, 163, 74]
        else if (cls === 'B') data.cell.styles.textColor = [202, 138, 4]
        else data.cell.styles.textColor = [220, 38, 38]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawPage: (data) => {
      addPageFooter(doc, data.pageNumber)
    },
  })

  doc.save(`relatorio-abc-${formatFileDate()}.pdf`)
}

/**
 * Generates a PDF for the Cash Flow Report.
 */
export function exportCashFlowReportPdf(organization, report, year) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = buildPdfHeader(doc, organization, `Fluxo de Caixa — ${year}`)

  y = addSummaryMetrics(doc, y, [
    { label: 'Vendas no Ano', value: String(report.yearTotalSales) },
    { label: 'Receita Bruta', value: formatCurrency(report.yearGrossRevenue) },
    { label: 'Descontos', value: formatCurrency(report.yearTotalDiscounts) },
    { label: 'Receita Líquida', value: formatCurrency(report.yearNetRevenue) },
    {
      label: 'Ticket Médio',
      value:
        report.yearTotalSales > 0
          ? formatCurrency(report.yearNetRevenue / report.yearTotalSales)
          : 'R$ 0,00',
    },
  ])

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  autoTable(doc, {
    startY: y + 2,
    head: [['Mês', 'Vendas', 'Rec. Bruta', 'Descontos', 'Rec. Líquida', 'Ticket Médio']],
    body: [
      ...report.months.map((m) => [
        monthNames[m.month - 1],
        m.salesCount,
        formatCurrency(m.grossRevenue),
        formatCurrency(m.totalDiscounts),
        formatCurrency(m.netRevenue),
        formatCurrency(m.averageTicket),
      ]),
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: String(report.yearTotalSales), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(report.yearGrossRevenue), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(report.yearTotalDiscounts), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(report.yearNetRevenue), styles: { fontStyle: 'bold' } },
        {
          content: report.yearTotalSales > 0 ? formatCurrency(report.yearNetRevenue / report.yearTotalSales) : 'R$ 0,00',
          styles: { fontStyle: 'bold' },
        },
      ],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    didDrawPage: (data) => {
      addPageFooter(doc, data.pageNumber)
    },
  })

  // Payment method breakdown
  if (report.paymentBreakdown?.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Breakdown por Forma de Pagamento', 14, finalY)

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Forma de Pagamento', 'Qtde Vendas', 'Total Recebido', '% do Total']],
      body: report.paymentBreakdown.map((p) => [
        p.paymentMethodName,
        p.salesCount,
        formatCurrency(p.totalAmount),
        formatPercent(p.percentage),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      didDrawPage: (data) => {
        addPageFooter(doc, data.pageNumber)
      },
    })
  }

  doc.save(`fluxo-caixa-${year}-${formatFileDate()}.pdf`)
}

function addPageFooter(doc, pageNumber) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
  doc.text("Ana's Store — Sistema de Gestão", 14, pageHeight - 6)
}

function formatFileDate() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
