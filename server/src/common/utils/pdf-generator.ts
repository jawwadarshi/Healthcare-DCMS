import PDFDocument from "pdfkit";

export interface InvoicePdfData {
    invoiceNumber: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    clinicName: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: string;
        subtotal: string;
    }>;
    subtotal: string;
    discount: string;
    total: string;
    issuedDate: string;
}

/**
 * Generate an invoice PDF buffer from the provided data.
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on("data", (chunk: Buffer) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            // ─── Header ──────────────────────────────────────────────────────
            doc.fontSize(22).font("Helvetica-Bold").text(data.clinicName, { align: "center" });
            doc.moveDown(0.3);
            doc.fontSize(10).font("Helvetica").text("INVOICE", { align: "center" });
            doc.moveDown(1);

            // ─── Invoice Meta ────────────────────────────────────────────────
            doc.fontSize(10).font("Helvetica");
            doc.text(`Invoice #: ${data.invoiceNumber}`, { continued: false });
            doc.text(`Date: ${data.issuedDate}`);
            doc.text(`Patient: ${data.patientName}`);
            doc.text(`Phone: ${data.patientPhone}`);
            doc.text(`Email: ${data.patientEmail}`);
            doc.moveDown(1.5);

            // ─── Table Header ────────────────────────────────────────────────
            const startX = doc.x;
            let currentY = doc.y;

            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("Description", startX, currentY, { width: 200 });
            doc.text("Qty", startX + 200, currentY, { width: 50, align: "center" });
            doc.text("Unit Price", startX + 260, currentY, { width: 90, align: "right" });
            doc.text("Subtotal", startX + 360, currentY, { width: 100, align: "right" });

            doc.moveDown(0.5);
            currentY = doc.y;

            // Line separator
            doc
                .moveTo(startX, currentY)
                .lineTo(startX + 480, currentY)
                .stroke();
            doc.moveDown(0.5);
            currentY = doc.y;

            // ─── Table Rows ──────────────────────────────────────────────────
            doc.fontSize(9).font("Helvetica");
            for (const item of data.items) {
                const rowY = doc.y;
                doc.text(item.description, startX, rowY, { width: 190 });
                doc.text(String(item.quantity), startX + 200, rowY, { width: 50, align: "center" });
                doc.text(`$${item.unitPrice}`, startX + 260, rowY, { width: 90, align: "right" });
                doc.text(`$${item.subtotal}`, startX + 360, rowY, { width: 100, align: "right" });
                doc.moveDown(0.8);
            }

            // Line separator
            currentY = doc.y;
            doc
                .moveTo(startX, currentY)
                .lineTo(startX + 480, currentY)
                .stroke();
            doc.moveDown(0.5);

            // ─── Totals ──────────────────────────────────────────────────────
            const labelX = startX + 280;
            const valueX = startX + 380;

            doc.fontSize(10).font("Helvetica");
            doc.text("Subtotal:", labelX, doc.y, { width: 100, align: "right" });
            doc.text(`$${data.subtotal}`, valueX, doc.y - 12, { width: 100, align: "right" });

            doc.text("Discount:", labelX, doc.y + 4, { width: 100, align: "right" });
            doc.text(`-$${data.discount}`, valueX, doc.y - 12, { width: 100, align: "right" });

            doc.moveDown(0.3);
            doc.fontSize(12).font("Helvetica-Bold");
            doc.text("Total:", labelX, doc.y, { width: 100, align: "right" });
            doc.text(`$${data.total}`, valueX, doc.y - 14, { width: 100, align: "right" });

            // ─── Footer ──────────────────────────────────────────────────────
            doc.moveDown(2);
            doc.fontSize(8).font("Helvetica").text(
                `Thank you for choosing ${data.clinicName}. Payment is due upon receipt.`,
                { align: "center" }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}