/**
 * GET /v1/billing/monthly-invoices/:id/pdf  — Download invoice as branded PDF
 *
 * Returns a PDF buffer with:
 *  - Company branding (logo, primary color)
 *  - Invoice header, period, line items table
 *  - Subtotal / commission / GST / total
 *  - Cobbr footer
 */

const { connect } = require("../../../swiftDb");
const PDFDocument = require("pdfkit");

// ── GCS for signed logo URLs ──
let bucket, gcsConfig;
try {
  bucket = require("../../../utils/gcsClient").bucket;
  gcsConfig = require("../../../config/gcs");
} catch (e) {
  // GCS optional — logos will be skipped in PDF
}

async function fetchLogoBuffer(logoPath) {
  if (!logoPath || !bucket) return null;
  try {
    const file = bucket.file(logoPath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buffer] = await file.download();
    return buffer;
  } catch (err) {
    console.warn("[pdfInvoice] Could not fetch logo:", err.message);
    return null;
  }
}

function hexToRgb(hex) {
  const clean = (hex || "#00a67e").replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 166 : g, isNaN(b) ? 126 : b];
}

function formatCurrency(amount, currency = "AUD") {
  return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const downloadInvoicePdf = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const invoiceId = parseInt(req.params.id);
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(invoiceId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT mi.*,
              COALESCE(c.trading_name, c.name) AS company_display_name,
              c.email AS company_email, c.phone AS company_phone,
              c.address AS company_address, c.city AS company_city,
              c.state AS company_state, c.postcode AS company_postcode,
              c.abn AS company_abn,
              c.logo_url AS company_logo_url,
              c.primary_color AS company_primary_color
       FROM monthly_invoices mi
       LEFT JOIN companies c ON c.id = mi.company_id
       WHERE mi.id = ? AND mi.company_id = ?`,
      [invoiceId, companyId]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Invoice not found" });

    const invoice = rows[0];

    const [items] = await connection.execute(
      `SELECT * FROM monthly_invoice_items WHERE invoice_id = ? ORDER BY job_date ASC`,
      [invoiceId]
    );

    // Fetch logo as buffer (for embedding in PDF)
    const logoBuffer = await fetchLogoBuffer(invoice.company_logo_url);

    // ── Build PDF ──
    const brandColor = hexToRgb(invoice.company_primary_color || "#00a67e");
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    const pdfReady = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    const pageWidth = doc.page.width - 100; // 50px margin each side
    const brandR = brandColor[0], brandG = brandColor[1], brandB = brandColor[2];

    // ── HEADER BAND ──
    doc.rect(0, 0, doc.page.width, 80).fill(`rgb(${brandR},${brandG},${brandB})`);

    // Logo (top-left in band)
    let headerTextX = 60;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 15, { height: 50, fit: [120, 50] });
        headerTextX = 185;
      } catch (e) {
        // fallback: no logo
      }
    }

    // Company name in header
    doc.fillColor("#ffffff")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(invoice.company_display_name || "Your Company", headerTextX, 28, {
        width: 300,
        ellipsis: true,
      });

    // INVOICE label (right side of header)
    doc.fontSize(22)
      .font("Helvetica-Bold")
      .text("INVOICE", doc.page.width - 180, 22, { width: 130, align: "right" });

    doc.fillColor("#000000");

    // ── INVOICE META ──
    const metaY = 100;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("INVOICE NUMBER", 50, metaY);
    doc.fontSize(11).font("Helvetica").fillColor("#000000").text(invoice.invoice_number || `INV-${invoiceId}`, 50, metaY + 12);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("PERIOD", 200, metaY);
    const periodLabel = (() => {
      const s = formatDate(invoice.period_start);
      const e = formatDate(invoice.period_end);
      return `${s} – ${e}`;
    })();
    doc.fontSize(11).font("Helvetica").fillColor("#000000").text(periodLabel, 200, metaY + 12);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("STATUS", 380, metaY);
    const statusStr = (invoice.status || "draft").toUpperCase();
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text(statusStr, 380, metaY + 12);

    // Due date
    if (invoice.due_date) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("DUE DATE", 460, metaY);
      doc.fontSize(11).font("Helvetica").fillColor("#000000").text(formatDate(invoice.due_date), 460, metaY + 12);
    }

    // ── COMPANY + ABN ──
    const infoY = 145;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("FROM", 50, infoY);
    doc.fontSize(10).font("Helvetica").fillColor("#333333");
    let cInfoY = infoY + 12;
    if (invoice.company_display_name) { doc.text(invoice.company_display_name, 50, cInfoY); cInfoY += 14; }
    if (invoice.company_abn) { doc.text(`ABN: ${invoice.company_abn}`, 50, cInfoY); cInfoY += 14; }
    if (invoice.company_email) { doc.text(invoice.company_email, 50, cInfoY); cInfoY += 14; }
    if (invoice.company_phone) { doc.text(invoice.company_phone, 50, cInfoY); cInfoY += 14; }

    // Client info (right side)
    if (invoice.client_name) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${brandR},${brandG},${brandB})`).text("BILLED TO", 380, infoY);
      doc.fontSize(10).font("Helvetica").fillColor("#333333").text(invoice.client_name, 380, infoY + 12);
    }

    // ── DIVIDER ──
    const divY = Math.max(cInfoY + 10, 210);
    doc.moveTo(50, divY).lineTo(doc.page.width - 50, divY).strokeColor(`rgb(${brandR},${brandG},${brandB})`).lineWidth(2).stroke();

    // ── LINE ITEMS TABLE ──
    const tableStartY = divY + 14;
    const col = { date: 50, code: 110, desc: 200, hours: 350, rate: 415, amount: 490 };
    const colWidths = { date: 55, code: 85, desc: 145, hours: 60, rate: 70, amount: 70 };

    // Table header
    doc.fillColor(`rgb(${brandR},${brandG},${brandB})`).rect(50, tableStartY, pageWidth, 18).fill();
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
    doc.text("DATE", col.date + 3, tableStartY + 4, { width: colWidths.date });
    doc.text("JOB CODE", col.code + 3, tableStartY + 4, { width: colWidths.code });
    doc.text("DESCRIPTION", col.desc + 3, tableStartY + 4, { width: colWidths.desc });
    doc.text("HOURS", col.hours + 3, tableStartY + 4, { width: colWidths.hours, align: "right" });
    doc.text("RATE", col.rate + 3, tableStartY + 4, { width: colWidths.rate, align: "right" });
    doc.text("AMOUNT", col.amount + 3, tableStartY + 4, { width: colWidths.amount, align: "right" });

    // Table rows
    let rowY = tableStartY + 22;
    doc.fillColor("#000000").fontSize(8).font("Helvetica");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowH = 18;

      if (i % 2 === 1) {
        doc.fillColor("#f8f8f8").rect(50, rowY, pageWidth, rowH).fill();
        doc.fillColor("#000000");
      }

      const descText = item.description || item.billing_mode || `Job ${item.job_code || item.job_id}`;
      doc.text(formatDate(item.job_date), col.date + 3, rowY + 4, { width: colWidths.date, ellipsis: true });
      doc.text(item.job_code || String(item.job_id), col.code + 3, rowY + 4, { width: colWidths.code, ellipsis: true });
      doc.text(descText, col.desc + 3, rowY + 4, { width: colWidths.desc, ellipsis: true });
      doc.text(item.hours_worked ? parseFloat(item.hours_worked).toFixed(1) : "", col.hours + 3, rowY + 4, { width: colWidths.hours, align: "right" });
      doc.text(item.hourly_rate ? `$${parseFloat(item.hourly_rate).toFixed(2)}` : "", col.rate + 3, rowY + 4, { width: colWidths.rate, align: "right" });
      doc.text(`$${parseFloat(item.amount || 0).toFixed(2)}`, col.amount + 3, rowY + 4, { width: colWidths.amount, align: "right" });

      rowY += rowH;

      // Page break if needed
      if (rowY > doc.page.height - 160) {
        doc.addPage();
        rowY = 50;
      }
    }

    // ── TOTALS ──
    const totalsY = rowY + 20;
    const totalsX = 380;
    const totalsW = 160;

    doc.moveTo(50, totalsY - 8).lineTo(doc.page.width - 50, totalsY - 8).strokeColor("#dddddd").lineWidth(1).stroke();

    const subtotal = parseFloat(invoice.subtotal || 0);
    const commissionAmount = parseFloat(invoice.commission_amount || 0);
    const taxAmount = parseFloat(invoice.tax_amount || 0);
    const totalAmount = parseFloat(invoice.total_amount || 0);
    const currency = invoice.currency || "AUD";

    doc.fontSize(9).font("Helvetica").fillColor("#555555");
    doc.text("Subtotal:", totalsX, totalsY, { width: 90, align: "right" });
    doc.text(formatCurrency(subtotal, currency), totalsX + 95, totalsY, { width: 65, align: "right" });

    if (commissionAmount > 0) {
      doc.text(`Platform fee (${parseFloat(invoice.commission_rate || 0).toFixed(1)}%):`, totalsX, totalsY + 16, { width: 90, align: "right" });
      doc.fillColor("#c0392b").text(`- ${formatCurrency(commissionAmount, currency)}`, totalsX + 95, totalsY + 16, { width: 65, align: "right" });
      doc.fillColor("#555555");
    }

    if (taxAmount > 0) {
      doc.text("GST (10%):", totalsX, totalsY + 32, { width: 90, align: "right" });
      doc.text(formatCurrency(taxAmount, currency), totalsX + 95, totalsY + 32, { width: 65, align: "right" });
    }

    // Total row
    const totalRowY = totalsY + 52;
    doc.fillColor(`rgb(${brandR},${brandG},${brandB})`).rect(totalsX - 10, totalRowY - 4, totalsW + 10, 24).fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
    doc.text("TOTAL:", totalsX, totalRowY + 2, { width: 90, align: "right" });
    doc.text(formatCurrency(totalAmount, currency), totalsX + 95, totalRowY + 2, { width: 65, align: "right" });

    // ── NOTES ──
    if (invoice.notes) {
      const notesY = totalRowY + 40;
      doc.fillColor("#555555").font("Helvetica-Bold").fontSize(9).text("Notes:", 50, notesY);
      doc.font("Helvetica").text(invoice.notes, 50, notesY + 14, { width: 300 });
    }

    // ── FOOTER ──
    const footerY = doc.page.height - 55;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor("#dddddd").lineWidth(0.5).stroke();
    doc.fillColor("#aaaaaa").fontSize(8).font("Helvetica")
      .text("Generated by Cobbr — cobbr-app.com", 50, footerY + 8, { align: "center", width: pageWidth });
    doc.text(`Invoice ${invoice.invoice_number || invoiceId} · ${new Date().toLocaleDateString("en-AU")}`, 50, footerY + 20, { align: "center", width: pageWidth });

    doc.end();
    await pdfReady;

    const pdfBuffer = Buffer.concat(buffers);
    const filename = `invoice_${invoice.invoice_number || invoiceId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ GET monthly-invoices/:id/pdf error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { downloadInvoicePdf };
