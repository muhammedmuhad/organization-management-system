import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const eventId =
      request.nextUrl.searchParams.get("eventId");

    const format =
      request.nextUrl.searchParams.get("format") ||
      "pdf";

    if (!eventId) {
      return new Response(
        "Event ID is required.",
        { status: 400 },
      );
    }

    const event =
      await prisma.event.findUnique({
        where: {
          id: eventId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          year: true,
          eventDate: true,
          venue: true,
          status: true,
          category: {
            select: {
              name: true,
            },
          },
          collections: {
            orderBy: {
              receivedDate: "asc",
            },
            select: {
              sourceName: true,
              amount: true,
              receivedDate: true,
              referenceNo: true,
              remarks: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          expenses: {
            orderBy: {
              expenseDate: "asc",
            },
            select: {
              expenseTitle: true,
              amount: true,
              expenseDate: true,
              billNumber: true,
              remarks: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          transfers: {
            orderBy: {
              transferDate: "asc",
            },
            select: {
              direction: true,
              amount: true,
              transferDate: true,
              referenceNo: true,
              remarks: true,
            },
          },
        },
      });

    if (!event) {
      return new Response(
        "Event not found.",
        { status: 404 },
      );
    }

    const totalCollections =
      event.collections.reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

    const totalExpenses =
      event.expenses.reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

    const finalResult =
      totalCollections - totalExpenses;

    const transferredToGeneralFund =
      event.transfers
        .filter(
          (item) =>
            item.direction ===
            "TO_GENERAL_FUND",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0,
        );

    const receivedFromGeneralFund =
      event.transfers
        .filter(
          (item) =>
            item.direction ===
            "FROM_GENERAL_FUND",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0,
        );

    const remainingSettlement =
      finalResult > 0
        ? Math.max(
            finalResult -
              transferredToGeneralFund,
            0,
          )
        : finalResult < 0
          ? Math.max(
              Math.abs(finalResult) -
                receivedFromGeneralFund,
              0,
            )
          : 0;

    const data = {
      event,
      totalCollections,
      totalExpenses,
      finalResult,
      transferredToGeneralFund,
      receivedFromGeneralFund,
      remainingSettlement,
    };

    if (format === "xlsx") {
      return createExcelResponse(data);
    }

    if (format === "pdf") {
      return createPdfResponse(data);
    }

    return new Response(
      "Unsupported export format.",
      { status: 400 },
    );
  } catch (error) {
    console.error(
      "Event report export error:",
      error,
    );

    return new Response(
      "Failed to generate event report.",
      { status: 500 },
    );
  }
}

function createExcelResponse(data: any) {
  const workbook = XLSX.utils.book_new();

  const summary = [
    ["EVENT FINANCIAL REPORT"],
    [],
    ["Event", data.event.title],
    ["Category", data.event.category.name],
    ["Year", data.event.year],
    ["Event Date", formatDate(data.event.eventDate)],
    ["Venue", data.event.venue || "Not specified"],
    ["Status", formatStatus(data.event.status)],
    [],
    ["Total Collections", data.totalCollections],
    ["Total Expenses", data.totalExpenses],
    [
      data.finalResult >= 0
        ? "Final Surplus"
        : "Final Deficit",
      Math.abs(data.finalResult),
    ],
    [
      "Transferred to General Fund",
      data.transferredToGeneralFund,
    ],
    [
      "Received from General Fund",
      data.receivedFromGeneralFund,
    ],
    [
      "Remaining Settlement",
      data.remainingSettlement,
    ],
  ];

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summary);

  summarySheet["!cols"] = [
    { wch: 32 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Summary",
  );

  const collectionRows = [
    [
      "Date",
      "Category",
      "Source",
      "Reference",
      "Remarks",
      "Amount",
    ],
    ...data.event.collections.map(
      (item: any) => [
        formatDate(item.receivedDate),
        item.category?.name || "",
        item.sourceName,
        item.referenceNo || "",
        item.remarks || "",
        Number(item.amount),
      ],
    ),
    [
      "",
      "",
      "",
      "",
      "TOTAL",
      data.totalCollections,
    ],
  ];

  const collectionSheet =
    XLSX.utils.aoa_to_sheet(
      collectionRows,
    );

  collectionSheet["!cols"] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 24 },
    { wch: 35 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    collectionSheet,
    "Collections",
  );

  const expenseRows = [
    [
      "Date",
      "Category",
      "Expense",
      "Bill / Reference",
      "Remarks",
      "Amount",
    ],
    ...data.event.expenses.map(
      (item: any) => [
        formatDate(item.expenseDate),
        item.category?.name || "",
        item.expenseTitle,
        item.billNumber || "",
        item.remarks || "",
        Number(item.amount),
      ],
    ),
    [
      "",
      "",
      "",
      "",
      "TOTAL",
      data.totalExpenses,
    ],
  ];

  const expenseSheet =
    XLSX.utils.aoa_to_sheet(
      expenseRows,
    );

  expenseSheet["!cols"] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 24 },
    { wch: 35 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    expenseSheet,
    "Expenses",
  );

  const transferRows = [
    [
      "Date",
      "Direction",
      "Amount",
      "Reference",
      "Remarks",
    ],
    ...data.event.transfers.map(
      (item: any) => [
        formatDate(item.transferDate),
        item.direction ===
        "TO_GENERAL_FUND"
          ? "Transferred to General Fund"
          : "Received from General Fund",
        Number(item.amount),
        item.referenceNo || "",
        item.remarks || "",
      ],
    ),
  ];

  const transferSheet =
    XLSX.utils.aoa_to_sheet(
      transferRows,
    );

  transferSheet["!cols"] = [
    { wch: 15 },
    { wch: 32 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    transferSheet,
    "Fund Transfers",
  );

  const buffer = XLSX.write(
    workbook,
    {
      type: "buffer",
      bookType: "xlsx",
    },
  );

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="event-report-${safeFileName(
          data.event.title,
        )}.xlsx"`,
    },
  });
}

async function createPdfResponse(
  data: any,
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => {
    chunks.push(Buffer.from(chunk));
  });

  const finished =
    new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);
    });

  drawReportHeader(
    doc,
    "EVENT FINANCIAL REPORT",
    `Event: ${data.event.title}`,
  );

  drawInfoTable(doc, [
    ["EVENT", data.event.title],
    ["CATEGORY", data.event.category.name],
    ["EVENT DATE", formatDate(data.event.eventDate)],
    ["YEAR", String(data.event.year)],
    ["VENUE", data.event.venue || "Not specified"],
    ["STATUS", formatStatus(data.event.status)],
  ]);

  drawSectionHeader(doc, "FINANCIAL SUMMARY");

  drawAmountTable(
    doc,
    [
      ["Total Collections", data.totalCollections],
      ["Total Expenses", data.totalExpenses],
      [
        data.finalResult >= 0
          ? "Final Surplus"
          : "Final Deficit",
        Math.abs(data.finalResult),
      ],
      [
        "Transferred to General Fund",
        data.transferredToGeneralFund,
      ],
      [
        "Received from General Fund",
        data.receivedFromGeneralFund,
      ],
      [
        "Remaining Settlement",
        data.remainingSettlement,
      ],
    ],
  );

  drawSectionHeader(doc, "COLLECTIONS");

  drawDetailTable(
    doc,
    ["Date", "Category", "Source", "Reference", "Amount"],
    data.event.collections.map(
      (item: any) => [
        formatDate(item.receivedDate),
        item.category?.name || "—",
        item.sourceName || "—",
        item.referenceNo || "—",
        formatNumber(Number(item.amount)),
      ],
    ),
  );

  drawTotalRow(
    doc,
    "TOTAL COLLECTIONS",
    data.totalCollections,
  );

  drawSectionHeader(doc, "EXPENSES");

  drawDetailTable(
    doc,
    [
      "Date",
      "Category",
      "Expense",
      "Bill / Reference",
      "Amount",
    ],
    data.event.expenses.map(
      (item: any) => [
        formatDate(item.expenseDate),
        item.category?.name || "—",
        item.expenseTitle || "—",
        item.billNumber || "—",
        formatNumber(Number(item.amount)),
      ],
    ),
  );

  drawTotalRow(
    doc,
    "TOTAL EXPENSES",
    data.totalExpenses,
  );

  drawSectionHeader(doc, "FUND TRANSFERS");

  drawDetailTable(
    doc,
    ["Date", "Direction", "Reference", "Remarks", "Amount"],
    data.event.transfers.map(
      (item: any) => [
        formatDate(item.transferDate),
        item.direction === "TO_GENERAL_FUND"
          ? "To General Fund"
          : "From General Fund",
        item.referenceNo || "—",
        item.remarks || "—",
        formatNumber(Number(item.amount)),
      ],
    ),
  );

  drawTotalRow(
    doc,
    "TOTAL TRANSFERS",
    data.event.transfers.reduce(
      (sum: number, item: any) =>
        sum + Number(item.amount),
      0,
    ),
  );

  drawSectionHeader(doc, "FINAL POSITION");

  const finalLabel =
    data.finalResult > 0
      ? "FINAL SURPLUS"
      : data.finalResult < 0
        ? "FINAL DEFICIT"
        : "FINAL RESULT";

  drawAmountTable(
    doc,
    [
      [finalLabel, Math.abs(data.finalResult)],
      [
        "Transferred to General Fund",
        data.transferredToGeneralFund,
      ],
      [
        "Received from General Fund",
        data.receivedFromGeneralFund,
      ],
      [
        "Remaining Settlement",
        data.remainingSettlement,
      ],
    ],
    true,
  );

  drawFooter(doc);

  doc.end();

  const pdfBuffer = await finished;

  return new Response(
    new Uint8Array(pdfBuffer),
    {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="event-report-${safeFileName(
            data.event.title,
          )}.pdf"`,
      },
    },
  );
}

function drawReportHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle: string,
) {
  const x = 42;
  const width = 511;

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("PANDARAKKANDAY MAHALLU COMMITTEE", x, doc.y, {
      width,
      align: "center",
      lineBreak: false,
    });

  doc
    .moveDown(0.18)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Under Pandarakkandy Palli Thanveerul Islam Madrassa & Dars Committee",
      x,
      doc.y,
      {
        width,
        align: "center",
        lineBreak: false,
      },
    );

  doc
    .moveDown(0.15)
    .font("Helvetica")
    .fontSize(9)
    .text("SNo : 386/91", x, doc.y, {
      width,
      align: "center",
      lineBreak: false,
    });

  doc
    .moveDown(0.55)
    .moveTo(x, doc.y)
    .lineTo(x + width, doc.y)
    .lineWidth(0.8)
    .stroke();

  doc
    .moveDown(0.55)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(title, x, doc.y, {
      width,
      align: "center",
      lineBreak: false,
    });

  doc
    .moveDown(0.12)
    .font("Helvetica")
    .fontSize(8.5)
    .text(subtitle, x, doc.y, {
      width,
      align: "center",
      lineBreak: false,
    });

  doc.moveDown(0.7);
}

function drawInfoTable(
  doc: PDFKit.PDFDocument,
  rows: [string, string][],
) {
  const x = 42;
  const width = 511;
  const labelWidth = 175;
  const valueWidth = width - labelWidth;
  const rowHeight = 22;

  ensurePdfSpace(doc, rowHeight * rows.length + 2);

  rows.forEach(([label, value]) => {
    const y = doc.y;

    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(label, x + 6, y + 6, {
        width: labelWidth - 12,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .text(value, x + labelWidth + 6, y + 6, {
        width: valueWidth - 12,
        align: "right",
        lineBreak: false,
      });

    doc.y = y + rowHeight;
  });

  const bottom = doc.y;
  doc
    .moveTo(x, bottom)
    .lineTo(x + width, bottom)
    .lineWidth(0.5)
    .stroke();

  doc
    .moveTo(x + labelWidth, bottom - rowHeight * rows.length)
    .lineTo(x + labelWidth, bottom)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(0.55);
}

function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  ensurePdfSpace(doc, 25);

  const x = 42;
  const width = 511;
  const y = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text(title, x, y, {
      width,
      lineBreak: false,
    });

  doc
    .moveTo(x, y + 16)
    .lineTo(x + width, y + 16)
    .lineWidth(0.8)
    .stroke();

  doc.y = y + 22;
}

function drawAmountTable(
  doc: PDFKit.PDFDocument,
  rows: [string, number][],
  showAmount = true,
  totalLabel?: string,
  totalAmount?: number,
) {
  const x = 42;
  const width = 511;
  const labelWidth = 360;
  const amountWidth = width - labelWidth;
  const rowHeight = 20;

  if (rows.length === 0) {
    rows = [["No records", 0]];
  }

  ensurePdfSpace(
    doc,
    rowHeight * rows.length +
      (totalLabel ? rowHeight : 0) +
      2,
  );

  rows.forEach(([label, amount]) => {
    const y = doc.y;

    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .text(label, x + 6, y + 5.5, {
        width: labelWidth - 12,
        lineBreak: false,
      });

    if (showAmount) {
      doc
        .text(
          formatNumber(amount),
          x + labelWidth + 6,
          y + 5.5,
          {
            width: amountWidth - 12,
            align: "right",
            lineBreak: false,
          },
        );
    }

    doc.y = y + rowHeight;
  });

  if (totalLabel && typeof totalAmount === "number") {
    const y = doc.y;

    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .lineWidth(0.8)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(totalLabel, x + 6, y + 5.5, {
        width: labelWidth - 12,
        align: "right",
        lineBreak: false,
      });

    doc.text(
      formatNumber(totalAmount),
      x + labelWidth + 6,
      y + 5.5,
      {
        width: amountWidth - 12,
        align: "right",
        lineBreak: false,
      },
    );

    doc.y = y + rowHeight;
  }

  doc
    .moveTo(x, doc.y)
    .lineTo(x + width, doc.y)
    .lineWidth(0.5)
    .stroke();

  doc
    .moveTo(x + labelWidth, doc.y - rowHeight * (rows.length + (totalLabel ? 1 : 0)))
    .lineTo(x + labelWidth, doc.y)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(0.45);
}

function ensurePdfSpace(
  doc: PDFKit.PDFDocument,
  height: number,
) {
  const availableBottom =
    doc.page.height - doc.page.margins.bottom;

  if (doc.y + height > availableBottom) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }
}

function drawFooter(
  doc: PDFKit.PDFDocument,
) {
  const range = doc.bufferedPageRange();

  for (
    let index = range.start;
    index < range.start + range.count;
    index++
  ) {
    doc.switchToPage(index);

    const footerY =
      doc.page.height -
      doc.page.margins.bottom -
      8;

    doc.save();

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#000000")
      .text(
        `Generated on ${new Date().toLocaleString("en-IN")}`,
        42,
        footerY,
        {
          width: 250,
          height: 10,
          align: "left",
          lineBreak: false,
        },
      )
      .text(
        `Page ${index + 1} of ${range.count}`,
        303,
        footerY,
        {
          width: 250,
          height: 10,
          align: "right",
          lineBreak: false,
        },
      );

    doc.restore();
  }

  doc.switchToPage(
    range.start + range.count - 1,
  );
}


function drawDetailTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
) {
  const x = 42;
  const width = 511;
  const widths = getColumnWidths(headers.length);
  const headerHeight = 22;
  const rowHeight = 21;

  ensurePdfSpace(doc, headerHeight + rowHeight);
  drawDetailTableHeader(doc, x, widths, headers, headerHeight);

  if (rows.length === 0) {
    const y = doc.y;
    doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8.5).text("No records.", x + 7, y + 6, {
      width: width - 14, align: "center", lineBreak: false,
    });
    doc.y = y + rowHeight;
    doc.moveTo(x, doc.y).lineTo(x + width, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.45);
    return;
  }

  rows.forEach((row) => {
    const pageBefore = doc.page;
    ensurePdfSpace(doc, rowHeight);
    if (doc.page !== pageBefore) {
      drawDetailTableHeader(doc, x, widths, headers, headerHeight);
    }

    const y = doc.y;
    let currentX = x;
    doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.5).stroke();

    row.forEach((cell, index) => {
      const cellWidth = widths[index];
      doc.font("Helvetica").fontSize(7.5).text(cell, currentX + 5, y + 5.5, {
        width: cellWidth - 10, height: rowHeight - 8, ellipsis: true,
        lineBreak: false, align: index === row.length - 1 ? "right" : "left",
      });
      currentX += cellWidth;
    });

    doc.y = y + rowHeight;
    currentX = x;
    widths.forEach((cellWidth) => {
      doc.moveTo(currentX, y).lineTo(currentX, doc.y).lineWidth(0.5).stroke();
      currentX += cellWidth;
    });
    doc.moveTo(x + width, y).lineTo(x + width, doc.y).lineWidth(0.5).stroke();
  });

  doc.moveTo(x, doc.y).lineTo(x + width, doc.y).lineWidth(0.5).stroke();
  doc.moveDown(0.45);
}

function drawDetailTableHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  widths: number[],
  headers: string[],
  height: number,
) {
  const y = doc.y;
  let currentX = x;
  const width = widths.reduce((sum, value) => sum + value, 0);

  doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.8).stroke();
  headers.forEach((header, index) => {
    const cellWidth = widths[index];
    doc.font("Helvetica-Bold").fontSize(7.5).text(header, currentX + 5, y + 6, {
      width: cellWidth - 10, lineBreak: false,
      align: index === headers.length - 1 ? "right" : "left",
    });
    doc.moveTo(currentX, y).lineTo(currentX, y + height).lineWidth(0.5).stroke();
    currentX += cellWidth;
  });
  doc.moveTo(currentX, y).lineTo(currentX, y + height).lineWidth(0.5).stroke();
  doc.moveTo(x, y + height).lineTo(currentX, y + height).lineWidth(0.8).stroke();
  doc.y = y + height;
}

function drawTotalRow(
  doc: PDFKit.PDFDocument,
  label: string,
  amount: number,
) {
  const x = 42;
  const width = 511;
  const labelWidth = 360;
  const amountWidth = width - labelWidth;
  const height = 22;

  ensurePdfSpace(doc, height);
  const y = doc.y;
  doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.8).stroke();
  doc.font("Helvetica-Bold").fontSize(8.5).text(label, x + 7, y + 6, {
    width: labelWidth - 14, align: "right", lineBreak: false,
  });
  doc.text(formatNumber(amount), x + labelWidth + 7, y + 6, {
    width: amountWidth - 14, align: "right", lineBreak: false,
  });
  doc.y = y + height;
  doc.moveTo(x, doc.y).lineTo(x + width, doc.y).lineWidth(0.8).stroke();
  doc.moveDown(0.45);
}

function getColumnWidths(count: number) {
  if (count === 4) {
    return [75, 185, 110, 141];
  }

  return [68, 105, 150, 110, 78];
}

function formatNumber(
  amount: number,
) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return "Open";
}

function safeFileName(
  value: string,
) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}