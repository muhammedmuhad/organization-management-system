import { NextRequest } from "next/server";
import { ReceiptPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const from =
      searchParams.get("from") ||
      getCurrentMonthStart();

    const to =
      searchParams.get("to") ||
      getCurrentMonthEnd();

    const format =
      searchParams.get("format") || "xlsx";

    const startDate = new Date(
      `${from}T00:00:00`,
    );

    const endDate = new Date(
      `${to}T23:59:59.999`,
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      return new Response(
        "Invalid date range.",
        {
          status: 400,
        },
      );
    }

    /*
     * =======================================================
     * FINANCIAL DATA
     *
     * These are the same three financial sources used by
     * the Finance module:
     *
     * 1. Income
     * 2. Expense
     * 3. MembershipReceipt
     *
     * MembershipReceipt has four purposes:
     * - MONTHLY_MEMBERSHIP
     * - RENT
     * - NIKAH_HOUSE_WARMING
     * - CUSTOM
     * =======================================================
     */

    const [income, expenses, receipts] =
      await Promise.all([
        prisma.income.findMany({
          where: {
            incomeDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            category: true,
          },
          orderBy: {
            incomeDate: "asc",
          },
        }),

        prisma.expense.findMany({
          where: {
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            category: true,
          },
          orderBy: {
            expenseDate: "asc",
          },
        }),

        prisma.membershipReceipt.findMany({
          where: {
            receiptDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            household: {
              select: {
                householdCode: true,
                houseName: true,
              },
            },
            items: {
              orderBy: [
                { year: "asc" },
                { month: "asc" },
              ],
              select: {
                year: true,
                month: true,
                amount: true,
              },
            },
          },
          orderBy: {
            receiptDate: "asc",
          },
        }),
      ]);

    /*
     * =======================================================
     * NORMAL INCOME
     * =======================================================
     */

    const regularIncome =
      income.reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

    const incomeBreakdownMap =
      new Map<string, number>();

    for (const item of income) {
      const category =
        item.category.name;

      incomeBreakdownMap.set(
        category,
        (incomeBreakdownMap.get(
          category,
        ) || 0) + Number(item.amount),
      );
    }

    const incomeBreakdown =
      Array.from(
        incomeBreakdownMap.entries(),
      )
        .map(
          ([category, amount]) => ({
            category,
            amount,
          }),
        )
        .sort(
          (a, b) =>
            b.amount - a.amount,
        );

    /*
     * =======================================================
     * EXPENSES
     * =======================================================
     */

    const totalExpenses =
      expenses.reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

    const expenseBreakdownMap =
      new Map<string, number>();

    for (const item of expenses) {
      const category =
        item.category.name;

      expenseBreakdownMap.set(
        category,
        (expenseBreakdownMap.get(
          category,
        ) || 0) + Number(item.amount),
      );
    }

    const expenseBreakdown =
      Array.from(
        expenseBreakdownMap.entries(),
      )
        .map(
          ([category, amount]) => ({
            category,
            amount,
          }),
        )
        .sort(
          (a, b) =>
            b.amount - a.amount,
        );

    /*
     * =======================================================
     * COLLECTIONS
     * =======================================================
     */

    const collectionTotals =
      new Map<string, number>();

    for (const receipt of receipts) {
      const label =
        formatPurpose(
          receipt.purpose,
        );

      collectionTotals.set(
        label,
        (collectionTotals.get(
          label,
        ) || 0) +
          Number(
            receipt.totalAmount,
          ),
      );
    }

    const membershipAmount =
      collectionTotals.get(
        formatPurpose(
          ReceiptPurpose.MONTHLY_MEMBERSHIP,
        ),
      ) || 0;

    const rentAmount =
      collectionTotals.get(
        formatPurpose(
          ReceiptPurpose.RENT,
        ),
      ) || 0;

    const nikahHouseWarmingAmount =
      collectionTotals.get(
        formatPurpose(
          ReceiptPurpose.NIKAH_HOUSE_WARMING,
        ),
      ) || 0;

    const customAmount =
      collectionTotals.get(
        formatPurpose(
          ReceiptPurpose.CUSTOM,
        ),
      ) || 0;

    const collectionSummary = [
      ReceiptPurpose.MONTHLY_MEMBERSHIP,
      ReceiptPurpose.RENT,
      ReceiptPurpose.NIKAH_HOUSE_WARMING,
      ReceiptPurpose.CUSTOM,
    ].map(
      (purpose) => ({
        purpose: formatPurpose(
          purpose,
        ),
        receipts:
          receipts.filter(
            (receipt) =>
              receipt.purpose ===
              purpose,
          ).length,
        amount:
          collectionTotals.get(
            formatPurpose(
              purpose,
            ),
          ) || 0,
      }),
    );

    const collectionRows =
      receipts.map(
        (receipt) => {
          const household =
            receipt.household
              ? `${receipt.household.houseName} (${receipt.household.householdCode})`
              : "—";

          let details =
            receipt.remarks ||
            "—";

          if (
            receipt.purpose ===
              ReceiptPurpose.MONTHLY_MEMBERSHIP ||
            receipt.purpose ===
              ReceiptPurpose.RENT
          ) {
            const itemDetails =
              receipt.items
                .map(
                  (item) => {
                    const month =
                      item.month
                        ? getMonthName(
                            item.month,
                          )
                        : "";

                    const year =
                      item.year
                        ? String(
                            item.year,
                          )
                        : "";

                    const period =
                      [
                        month,
                        year,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(" ");

                    return period
                      ? `${period} (${formatNumber(Number(item.amount))})`
                      : formatNumber(
                          Number(
                            item.amount,
                          ),
                        );
                  },
                )
                .join(", ");

            if (itemDetails) {
              details =
                itemDetails;
            }
          }

          if (
            receipt.purpose ===
            ReceiptPurpose.CUSTOM
          ) {
            details =
              [
                receipt.customName,
                receipt.customPurpose,
              ]
                .filter(Boolean)
                .join(" — ") ||
              receipt.remarks ||
              "—";
          }

          return {
            date:
              receipt.receiptDate,
            receiptNumber:
              receipt.receiptNumber,
            purpose:
              formatPurpose(
                receipt.purpose,
              ),
            household,
            details,
            amount:
              Number(
                receipt.totalAmount,
              ),
          };
        },
      );

    const householdIds =
      new Set(
        receipts
          .map(
            (receipt) =>
              receipt.householdId,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      );

    /*
     * =======================================================
     * TOTALS
     * =======================================================
     */

    const totalCollections =
      membershipAmount +
      rentAmount +
      nikahHouseWarmingAmount +
      customAmount;

    const totalIncome =
      regularIncome +
      totalCollections;

    const netBalance =
      totalIncome -
      totalExpenses;

    const reportData = {
      from,
      to,

      regularIncome,

      membershipAmount,
      rentAmount,
      nikahHouseWarmingAmount,
      customAmount,

      totalCollections,
      totalIncome,
      totalExpenses,
      netBalance,

      membershipReceipts:
        receipts.length,

      householdsPaid:
        householdIds.size,

      incomeBreakdown,
      expenseBreakdown,
      collectionSummary,
      collectionRows,

      incomeRows:
        income.map(
          (item) => ({
            date:
              item.incomeDate,
            category:
              item.category.name,
            description:
              item.description ||
              "—",
            reference:
              item.receiptNumber ||
              "—",
            amount:
              Number(
                item.amount,
              ),
          }),
        ),

      expenseRows:
        expenses.map(
          (item) => ({
            date:
              item.expenseDate,
            category:
              item.category.name,
            description:
              item.description ||
              "—",
            reference:
              item.billNumber ||
              "—",
            amount:
              Number(
                item.amount,
              ),
          }),
        ),
    };

    /*
     * =======================================================
     * EXCEL
     * =======================================================
     */

    if (format === "xlsx") {
      return createExcelResponse(
        reportData,
      );
    }

    /*
     * =======================================================
     * PDF
     * =======================================================
     */

    if (format === "pdf") {
      return createPdfResponse(
        reportData,
      );
    }

    return new Response(
      "Unsupported export format.",
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Report export error:",
      error,
    );

    return new Response(
      "Failed to generate report.",
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   EXCEL
========================================================= */

function createExcelResponse(
  data: any,
) {
  const workbook =
    XLSX.utils.book_new();

  const summary = [
    ["PANDARAKKANDAY MAHALLU COMMITTEE"],
    [
      "Under Pandarakkandy Palli Thanveerul Islam Madrassa & Dars Committee",
    ],
    ["SNo : 386/91"],
    [],
    ["FINANCIAL REPORT"],
    [
      "Period",
      `${data.from} to ${data.to}`,
    ],
    [],
    ["FINANCIAL SUMMARY", "AMOUNT"],
    [
      "Normal Income",
      data.regularIncome,
    ],
    [
      "Collections",
      data.totalCollections,
    ],
    [
      "TOTAL INCOME",
      data.totalIncome,
    ],
    [
      "TOTAL EXPENSES",
      data.totalExpenses,
    ],
    [
      "NET BALANCE",
      data.netBalance,
    ],
    [],
    [
      "Collection Receipts",
      data.membershipReceipts,
    ],
    [
      "Households with Collections",
      data.householdsPaid,
    ],
  ];

  const summarySheet =
    XLSX.utils.aoa_to_sheet(
      summary,
    );

  summarySheet["!cols"] = [
    { wch: 48 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Summary",
  );

  const incomeRows = [
    [
      "Date",
      "Category",
      "Description",
      "Reference",
      "Amount",
    ],
    ...data.incomeRows.map(
      (item: any) => [
        formatDate(item.date),
        item.category,
        item.description,
        item.reference,
        item.amount,
      ],
    ),
    [
      "",
      "",
      "",
      "TOTAL",
      data.regularIncome,
    ],
  ];

  const incomeSheet =
    XLSX.utils.aoa_to_sheet(
      incomeRows,
    );

  incomeSheet["!cols"] = [
    { wch: 15 },
    { wch: 28 },
    { wch: 42 },
    { wch: 22 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    incomeSheet,
    "Income",
  );

  const collectionRows = [
    [
      "Date",
      "Receipt No.",
      "Type",
      "Household",
      "Details",
      "Amount",
    ],
    ...data.collectionRows.map(
      (item: any) => [
        formatDate(item.date),
        item.receiptNumber,
        item.purpose,
        item.household,
        item.details,
        item.amount,
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
    { wch: 20 },
    { wch: 28 },
    { wch: 34 },
    { wch: 55 },
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
      "Description",
      "Bill / Reference",
      "Amount",
    ],
    ...data.expenseRows.map(
      (item: any) => [
        formatDate(item.date),
        item.category,
        item.description,
        item.reference,
        item.amount,
      ],
    ),
    [
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
    { wch: 28 },
    { wch: 42 },
    { wch: 22 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    expenseSheet,
    "Expenses",
  );

  const incomeSummaryRows = [
    [
      "INCOME CATEGORY",
      "AMOUNT",
    ],
    ...data.incomeBreakdown.map(
      (item: any) => [
        item.category,
        item.amount,
      ],
    ),
    [
      "TOTAL NORMAL INCOME",
      data.regularIncome,
    ],
  ];

  const incomeSummarySheet =
    XLSX.utils.aoa_to_sheet(
      incomeSummaryRows,
    );

  incomeSummarySheet["!cols"] = [
    { wch: 42 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    incomeSummarySheet,
    "Income Summary",
  );

  const collectionSummaryRows = [
    [
      "COLLECTION TYPE",
      "RECEIPTS",
      "AMOUNT",
    ],
    ...data.collectionSummary.map(
      (item: any) => [
        item.purpose,
        item.receipts,
        item.amount,
      ],
    ),
    [
      "TOTAL COLLECTIONS",
      data.membershipReceipts,
      data.totalCollections,
    ],
  ];

  const collectionSummarySheet =
    XLSX.utils.aoa_to_sheet(
      collectionSummaryRows,
    );

  collectionSummarySheet["!cols"] = [
    { wch: 42 },
    { wch: 14 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    collectionSummarySheet,
    "Collection Summary",
  );


  const buffer =
    XLSX.write(
      workbook,
      {
        type: "buffer",
        bookType: "xlsx",
      },
    );

  return new Response(
    buffer,
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="financial-report-${data.from}-to-${data.to}.xlsx"`,
      },
    },
  );
}

/* =========================================================
   PDF
========================================================= */

async function createPdfResponse(
  data: any,
) {
  const doc =
    new PDFDocument({
      size: "A4",
      margin: 42,
      bufferPages: false,
    });

  const chunks: Buffer[] = [];
  let pageNumber = 1;

  doc.on(
    "data",
    (chunk) => {
      chunks.push(
        Buffer.from(chunk),
      );
    },
  );

  const finished =
    new Promise<Buffer>(
      (resolve, reject) => {
        doc.on(
          "end",
          () =>
            resolve(
              Buffer.concat(
                chunks,
              ),
            ),
        );

        doc.on(
          "error",
          reject,
        );
      },
    );

  /*
   * Footer is attached to newly-created pages.
   * No buffered-page footer pass is used, which prevents
   * footer rendering from creating unwanted blank pages.
   */
  doc.on(
    "pageAdded",
    () => {
      pageNumber += 1;
      drawPageFooter(
        doc,
        pageNumber,
      );
    },
  );

  drawReportHeader(
    doc,
    data,
  );

  drawSectionTitle(
    doc,
    "FINANCIAL SUMMARY",
  );

  drawTwoColumnTable(
    doc,
    [
      [
        "Normal Income",
        formatNumber(
          data.regularIncome,
        ),
      ],
      [
        "Collections",
        formatNumber(
          data.totalCollections,
        ),
      ],
      [
        "TOTAL INCOME",
        formatNumber(
          data.totalIncome,
        ),
        true,
      ],
      [
        "TOTAL EXPENSES",
        formatNumber(
          data.totalExpenses,
        ),
      ],
      [
        "NET BALANCE",
        formatNumber(
          data.netBalance,
        ),
        true,
      ],
    ],
  );

  drawSectionTitle(
    doc,
    "COLLECTION SUMMARY",
  );

  drawThreeColumnTable(
    doc,
    [
      "Collection Type",
      "Receipts",
      "Amount",
    ],
    data.collectionSummary.map(
      (item: any) => [
        item.purpose,
        String(item.receipts),
        formatNumber(
          item.amount,
        ),
      ],
    ),
    [
      "TOTAL COLLECTIONS",
      String(
        data.membershipReceipts,
      ),
      formatNumber(
        data.totalCollections,
      ),
    ],
  );

  drawSectionTitle(
    doc,
    "NORMAL INCOME",
  );

  drawFiveColumnTable(
    doc,
    [
      "Date",
      "Category",
      "Description",
      "Reference",
      "Amount",
    ],
    data.incomeRows.map(
      (item: any) => [
        formatDate(item.date),
        item.category,
        item.description,
        item.reference,
        formatNumber(
          item.amount,
        ),
      ],
    ),
    [
      "",
      "",
      "",
      "TOTAL",
      formatNumber(
        data.regularIncome,
      ),
    ],
  );

  drawSectionTitle(
    doc,
    "EXPENSES",
  );

  drawFiveColumnTable(
    doc,
    [
      "Date",
      "Category",
      "Description",
      "Bill / Reference",
      "Amount",
    ],
    data.expenseRows.map(
      (item: any) => [
        formatDate(item.date),
        item.category,
        item.description,
        item.reference,
        formatNumber(
          item.amount,
        ),
      ],
    ),
    [
      "",
      "",
      "",
      "TOTAL",
      formatNumber(
        data.totalExpenses,
      ),
    ],
  );


  drawSectionTitle(
    doc,
    "FINAL POSITION",
  );

  drawTwoColumnTable(
    doc,
    [
      [
        "Total Income",
        formatNumber(
          data.totalIncome,
        ),
      ],
      [
        "Total Expenses",
        formatNumber(
          data.totalExpenses,
        ),
      ],
      [
        "NET BALANCE",
        formatNumber(
          data.netBalance,
        ),
        true,
      ],
    ],
  );

  /*
   * Draw the footer on the first page after all content.
   * New pages already receive their footer through pageAdded.
   */
  drawPageFooter(
    doc,
    pageNumber,
  );

  doc.end();

  const pdfBuffer =
    await finished;

  return new Response(
    new Uint8Array(
      pdfBuffer,
    ),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/pdf",
        "Content-Disposition":
          `attachment; filename="financial-report-${data.from}-to-${data.to}.pdf"`,
      },
    },
  );
}

/* =========================================================
   PDF HEADER
========================================================= */

function drawReportHeader(
  doc: PDFKit.PDFDocument,
  data: any,
) {
  const x =
    doc.page.margins.left;

  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#000000")
    .text(
      "PANDARAKKANDAY MAHALLU COMMITTEE",
      x,
      doc.y,
      {
        width,
        align: "center",
      },
    );

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .text(
      "Under Pandarakkandy Palli Thanveerul Islam Madrassa & Dars Committee",
      x,
      doc.y + 4,
      {
        width,
        align: "center",
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text(
      "SNo : 386/91",
      x,
      doc.y + 3,
      {
        width,
        align: "center",
      },
    );

  doc.moveDown(0.9);

  doc
    .moveTo(
      x,
      doc.y,
    )
    .lineTo(
      x + width,
      doc.y,
    )
    .lineWidth(0.7)
    .strokeColor("#000000")
    .stroke();

  doc.moveDown(0.8);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(
      "FINANCIAL REPORT",
      x,
      doc.y,
      {
        width,
        align: "center",
      },
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Period: ${formatDisplayDate(
        data.from,
      )} to ${formatDisplayDate(
        data.to,
      )}`,
      x,
      doc.y + 4,
      {
        width,
        align: "center",
      },
    );

  doc.moveDown(0.9);
}

/* =========================================================
   PDF TABLES
========================================================= */

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  ensurePdfSpace(
    doc,
    28,
  );

  const x =
    doc.page.margins.left;

  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;

  const y = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#000000")
    .text(
      title,
      x,
      y,
      { width },
    );

  doc
    .moveTo(
      x,
      y + 15,
    )
    .lineTo(
      x + width,
      y + 15,
    )
    .lineWidth(0.6)
    .strokeColor("#000000")
    .stroke();

  doc.y =
    y + 22;
}

function drawTwoColumnTable(
  doc: PDFKit.PDFDocument,
  rows: Array<
    [string, string] |
    [string, string, boolean]
  >,
) {
  drawTable(
    doc,
    [
      "Description",
      "Amount",
    ],
    rows.map(
      (row) => [
        row[0],
        row[1],
      ],
    ),
    [
      0.70,
      0.30,
    ],
    undefined,
    (index) =>
      Boolean(
        rows[index]?.[2],
      ),
  );
}

function drawThreeColumnTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  totalRow?: string[],
) {
  drawTable(
    doc,
    headers,
    rows,
    [
      0.55,
      0.17,
      0.28,
    ],
    totalRow,
  );
}

function drawFiveColumnTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  totalRow?: string[],
) {
  drawTable(
    doc,
    headers,
    rows,
    [
      0.12,
      0.22,
      0.30,
      0.18,
      0.18,
    ],
    totalRow,
  );
}

function drawSixColumnTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  totalRow?: string[],
) {
  drawTable(
    doc,
    headers,
    rows,
    [
      0.10,
      0.14,
      0.17,
      0.20,
      0.25,
      0.14,
    ],
    totalRow,
  );
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widthRatios: number[],
  totalRow?: string[],
  boldRows?: (
    index: number,
  ) => boolean,
) {
  const x =
    doc.page.margins.left;

  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;

  const headerHeight = 20;
  const rowHeight = 19;

  function getWidths() {
    return widthRatios.map(
      (ratio) =>
        width * ratio,
    );
  }

  function drawRow(
    values: string[],
    height: number,
    bold = false,
  ) {
    const widths =
      getWidths();

    const y = doc.y;
    let currentX = x;

    values.forEach(
      (value, index) => {
        const cellWidth =
          widths[index] ||
          0;

        doc
          .rect(
            currentX,
            y,
            cellWidth,
            height,
          )
          .lineWidth(
            0.45,
          )
          .strokeColor(
            "#000000",
          )
          .stroke();

        doc
          .font(
            bold
              ? "Helvetica-Bold"
              : "Helvetica",
          )
          .fontSize(7.4)
          .fillColor(
            "#000000",
          )
          .text(
            String(
              value ?? "",
            ),
            currentX + 5,
            y + 5,
            {
              width:
                Math.max(
                  cellWidth -
                    10,
                  1,
                ),
              height:
                Math.max(
                  height -
                    8,
                  1,
                ),
              align:
                index ===
                values.length -
                  1
                  ? "right"
                  : "left",
              ellipsis: true,
              lineBreak:
                false,
            },
          );

        currentX +=
          cellWidth;
      },
    );

    doc.y =
      y + height;
  }

  ensurePdfSpace(
    doc,
    headerHeight +
      rowHeight +
      4,
  );

  drawRow(
    headers,
    headerHeight,
    true,
  );

  rows.forEach(
    (
      row,
      index,
    ) => {
      if (
        doc.y +
          rowHeight >
        doc.page.height -
          doc.page.margins
            .bottom -
          18
      ) {
        doc.addPage();
        doc.y = doc.page.margins.top;

        drawRow(
          headers,
          headerHeight,
          true,
        );
      }

      drawRow(
        row,
        rowHeight,
        boldRows
          ? boldRows(index)
          : false,
      );
    },
  );

  if (totalRow) {
    if (
      doc.y +
        rowHeight >
      doc.page.height -
        doc.page.margins
          .bottom -
        18
    ) {
      doc.addPage();
      doc.y = doc.page.margins.top;

      drawRow(
        headers,
        headerHeight,
        true,
      );
    }

    drawRow(
      totalRow,
      rowHeight,
      true,
    );
  }

  doc.moveDown(
    0.55,
  );
}

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
) {
  const x =
    doc.page.margins.left;

  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;

  const y =
    doc.page.height -
    doc.page.margins.bottom -
    10;

  doc.save();

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(
      "#000000",
    )
    .text(
      "Pandarakkanday Mahallu Committee",
      x,
      y,
      {
        width:
          width / 2,
        height: 10,
        lineBreak: false,
        align: "left",
      },
    )
    .text(
      `Page ${pageNumber}`,
      x +
        width / 2,
      y,
      {
        width:
          width / 2,
        height: 10,
        lineBreak: false,
        align: "right",
      },
    );

  doc.restore();
}

function ensurePdfSpace(
  doc: PDFKit.PDFDocument,
  height: number,
) {
  const availableBottom =
    doc.page.height -
    doc.page.margins.bottom -
    18;

  if (
    doc.y + height >
    availableBottom
  ) {
    doc.addPage();
    doc.y =
      doc.page.margins.top;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function formatPurpose(
  purpose: string,
) {
  if (
    purpose ===
    ReceiptPurpose.MONTHLY_MEMBERSHIP
  ) {
    return "Monthly Membership";
  }

  if (
    purpose ===
    ReceiptPurpose.RENT
  ) {
    return "Rent";
  }

  if (
    purpose ===
    ReceiptPurpose.NIKAH_HOUSE_WARMING
  ) {
    return "Nikah / House Warming";
  }

  if (
    purpose ===
    ReceiptPurpose.CUSTOM
  ) {
    return "Custom Collection";
  }

  return purpose.replaceAll(
    "_",
    " ",
  );
}

function getMonthName(
  month: number,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
    },
  ).format(
    new Date(
      2000,
      month - 1,
      1,
    ),
  );
}

function formatNumber(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(amount) || 0,
  );
}

function formatDisplayDate(
  value: string,
) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatDate(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthStart() {
  const date = new Date();

  return formatDate(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    ),
  );
}

function getCurrentMonthEnd() {
  const date = new Date();

  return formatDate(
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ),
  );
}
