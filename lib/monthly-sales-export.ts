export type MonthlySaleExportRow = {
  id: string;
  sale_date: string;
  customer_name: string | null;
  customer_email: string | null;
  category: string;
  description: string;
  amount_usd: number;
  payment_status: string;
  payment_method: string | null;
  booking_source: string | null;
  reservation_id: string | null;
  notes: string | null;
};

const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1),
  );
};

const monthlyRows = (sales: MonthlySaleExportRow[], month: string) =>
  sales
    .filter((sale) => String(sale.sale_date || "").startsWith(month))
    .sort((a, b) => String(a.sale_date).localeCompare(String(b.sale_date)));

const summary = (rows: MonthlySaleExportRow[]) => {
  const active = rows.filter((sale) => String(sale.payment_status).toLowerCase() !== "refunded");
  const paid = rows
    .filter((sale) => String(sale.payment_status).toLowerCase() === "paid")
    .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
  const pending = rows
    .filter((sale) => ["pending", "partial"].includes(String(sale.payment_status).toLowerCase()))
    .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
  const refunded = rows
    .filter((sale) => String(sale.payment_status).toLowerCase() === "refunded")
    .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
  const gross = active.reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
  return { gross, paid, pending, refunded, entries: rows.length };
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const xmlEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const excelTextCell = (value: unknown, style = "Cell") =>
  `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;

const excelNumberCell = (value: number, style = "Money") =>
  `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(value || 0).toFixed(2)}</Data></Cell>`;

export function exportMonthlySalesExcel(sales: MonthlySaleExportRow[], month: string) {
  const rows = monthlyRows(sales, month);
  const totals = summary(rows);
  const title = monthLabel(month);

  const detailRows = rows
    .map(
      (sale) => `<Row>
        ${excelTextCell(sale.sale_date)}
        ${excelTextCell(sale.customer_name || "Guest")}
        ${excelTextCell(sale.customer_email || "")}
        ${excelTextCell(sale.category)}
        ${excelTextCell(sale.description)}
        ${excelNumberCell(Number(sale.amount_usd || 0))}
        ${excelTextCell(sale.payment_status)}
        ${excelTextCell(sale.payment_method || "")}
        ${excelTextCell(sale.booking_source || "")}
        ${excelTextCell(sale.reservation_id || "")}
        ${excelTextCell(sale.notes || "")}
      </Row>`,
    )
    .join("\n");

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#071922"/></Style>
  <Style ss:ID="Sub"><Font ss:FontName="Arial" ss:Size="10" ss:Color="#666666"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B2731" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Cell"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6E6E6"/></Borders></Style>
  <Style ss:ID="Money"><NumberFormat ss:Format="USD #,##0.00"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6E6E6"/></Borders></Style>
  <Style ss:ID="Metric"><Font ss:Bold="1" ss:Color="#8D7037"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(title)}">
  <Table>
   <Column ss:Width="78"/><Column ss:Width="125"/><Column ss:Width="170"/><Column ss:Width="85"/><Column ss:Width="220"/><Column ss:Width="90"/><Column ss:Width="85"/><Column ss:Width="95"/><Column ss:Width="100"/><Column ss:Width="160"/><Column ss:Width="220"/>
   <Row ss:Height="28"><Cell ss:StyleID="Title" ss:MergeAcross="10"><Data ss:Type="String">Tripelor Monthly Sales Report</Data></Cell></Row>
   <Row><Cell ss:StyleID="Sub" ss:MergeAcross="10"><Data ss:Type="String">Reporting period: ${xmlEscape(title)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Sub" ss:MergeAcross="10"><Data ss:Type="String">Generated: ${xmlEscape(new Date().toLocaleString())}</Data></Cell></Row>
   <Row></Row>
   <Row>${excelTextCell("Gross sales", "Metric")}${excelNumberCell(totals.gross)}</Row>
   <Row>${excelTextCell("Paid revenue", "Metric")}${excelNumberCell(totals.paid)}</Row>
   <Row>${excelTextCell("Pending / partial", "Metric")}${excelNumberCell(totals.pending)}</Row>
   <Row>${excelTextCell("Refunded", "Metric")}${excelNumberCell(totals.refunded)}</Row>
   <Row>${excelTextCell("Sales entries", "Metric")}${excelNumberCell(totals.entries, "Cell")}</Row>
   <Row></Row>
   <Row>
    ${["Date", "Customer", "Email", "Category", "Description", "Amount USD", "Payment", "Payment Method", "Source", "Reservation ID", "Notes"]
      .map((value) => excelTextCell(value, "Header"))
      .join("")}
   </Row>
   ${detailRows || `<Row><Cell ss:MergeAcross="10"><Data ss:Type="String">No sales recorded for this month.</Data></Cell></Row>`}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>11</SplitHorizontal><TopRowBottomPane>11</TopRowBottomPane></WorksheetOptions>
 </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `tripelor-sales-${month}.xls`,
  );
}

const ascii = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");

const pdfEscape = (value: unknown) => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const wrap = (text: string, max = 92) => {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const buildPdf = (pages: string[][]) => {
  const objects: string[] = [""];
  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((lines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    const content = [
      "BT",
      "/F1 10 Tf",
      "42 805 Td",
      ...lines.flatMap((line) => [`(${pdfEscape(line)}) Tj`, "0 -14 Td"]),
      "ET",
    ].join("\n");
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = new Array(objects.length).fill(0);
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

export function exportMonthlySalesPdf(sales: MonthlySaleExportRow[], month: string) {
  const rows = monthlyRows(sales, month);
  const totals = summary(rows);
  const title = monthLabel(month);
  const categoryTotals = new Map<string, number>();
  rows
    .filter((sale) => String(sale.payment_status).toLowerCase() !== "refunded")
    .forEach((sale) => {
      const key = sale.category || "other";
      categoryTotals.set(key, (categoryTotals.get(key) || 0) + Number(sale.amount_usd || 0));
    });

  const lines: string[] = [
    "TRIPELOR - MONTHLY SALES REPORT",
    `Reporting period: ${title}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Gross sales: USD ${totals.gross.toFixed(2)}`,
    `Paid revenue: USD ${totals.paid.toFixed(2)}`,
    `Pending / partial: USD ${totals.pending.toFixed(2)}`,
    `Refunded: USD ${totals.refunded.toFixed(2)}`,
    `Sales entries: ${totals.entries}`,
    "",
    "CATEGORY TOTALS",
    ...Array.from(categoryTotals.entries()).map(([category, amount]) => `${category}: USD ${amount.toFixed(2)}`),
    "",
    "SALES DETAILS",
    "Date | Customer | Category | Amount | Payment | Source",
    "--------------------------------------------------------------------------",
  ];

  if (!rows.length) {
    lines.push("No sales recorded for this month.");
  } else {
    rows.forEach((sale) => {
      const first = `${sale.sale_date} | ${sale.customer_name || "Guest"} | ${sale.category} | USD ${Number(sale.amount_usd || 0).toFixed(2)} | ${sale.payment_status} | ${sale.booking_source || "-"}`;
      wrap(first).forEach((line) => lines.push(line));
      wrap(`  ${sale.description}`, 88).forEach((line) => lines.push(line));
      if (sale.payment_method) lines.push(`  Payment method: ${ascii(sale.payment_method)}`);
      if (sale.notes) wrap(`  Notes: ${sale.notes}`, 88).forEach((line) => lines.push(line));
      lines.push("");
    });
  }

  const linesPerPage = 48;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    const page = lines.slice(index, index + linesPerPage);
    if (index > 0) page.unshift(`TRIPELOR SALES - ${title} (continued)`, "");
    pages.push(page);
  }
  if (!pages.length) pages.push(["TRIPELOR - MONTHLY SALES REPORT", `Reporting period: ${title}`]);

  downloadBlob(buildPdf(pages), `tripelor-sales-${month}.pdf`);
}
