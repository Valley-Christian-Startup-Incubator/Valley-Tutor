import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

// Coordinates below were measured directly off page 2 of the source PDFs
// (public/legal/*.pdf, both US Letter 612x792) with PyMuPDF, in its top-down
// coordinate space, then converted to pdf-lib's bottom-left origin.
type LineBox = { x0: number; x1: number; y0: number; y1: number };

const PAGE_HEIGHT = 792;
const TEXT_PAD_X = 4;
const TEXT_PAD_Y = 3;
const SIG_PAD_Y = -2; // sits signature image slightly closer to the rule than typed text

function textPos(line: LineBox) {
  return { x: line.x0 + TEXT_PAD_X, y: PAGE_HEIGHT - line.y1 + TEXT_PAD_Y };
}

function sigPos(line: LineBox) {
  return { x: line.x0 + TEXT_PAD_X, y: PAGE_HEIGHT - line.y1 + TEXT_PAD_Y + SIG_PAD_Y };
}

type Layout = {
  file: string;
  roleLabel: string; // "Tutee" | "Tutor" — the student-side label used in the PDF
  guardianPrintedLine: LineBox;
  guardianSigLine: LineBox;
  guardianDateLine: LineBox;
  studentPrintedLine: LineBox;
  studentSigLine: LineBox;
  studentDateLine: LineBox;
};

const LAYOUTS: Record<"tutor" | "tutee", Layout> = {
  tutee: {
    file: "tutee-agreement.pdf",
    roleLabel: "Tutee",
    guardianPrintedLine: { x0: 72, x1: 261.5, y0: 429.0, y1: 441.3 },
    guardianSigLine: { x0: 72, x1: 261.5, y0: 479.6, y1: 491.9 },
    guardianDateLine: { x0: 327.1, x1: 418.8, y0: 479.6, y1: 491.9 },
    studentPrintedLine: { x0: 72, x1: 261.5, y0: 543.5, y1: 555.8 },
    studentSigLine: { x0: 72, x1: 261.5, y0: 594.1, y1: 606.4 },
    studentDateLine: { x0: 324.0, x1: 415.7, y0: 594.1, y1: 606.4 },
  },
  tutor: {
    file: "tutor-agreement.pdf",
    roleLabel: "Tutor",
    guardianPrintedLine: { x0: 72, x1: 261.5, y0: 472.7, y1: 485.0 },
    guardianSigLine: { x0: 72, x1: 261.5, y0: 523.3, y1: 535.6 },
    guardianDateLine: { x0: 327.1, x1: 418.8, y0: 523.3, y1: 535.6 },
    studentPrintedLine: { x0: 72, x1: 261.5, y0: 587.1, y1: 599.4 },
    studentSigLine: { x0: 72, x1: 261.5, y0: 637.7, y1: 650.0 },
    studentDateLine: { x0: 324.0, x1: 415.7, y0: 637.7, y1: 650.0 },
  },
};

export type FillAgreementInput = {
  role: "tutor" | "tutee";
  studentName: string;
  guardianName: string;
  /** ISO date string, e.g. "2026-08-26" */
  signedDate: string;
  /** data URL from a <canvas>.toDataURL("image/png") */
  studentSignaturePng: string;
  guardianSignaturePng: string;
};

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function fillAgreementPdf(input: FillAgreementInput): Promise<Uint8Array> {
  const layout = LAYOUTS[input.role];
  const templateBytes = await fs.readFile(path.join(process.cwd(), "public", "legal", layout.file));

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[1]; // signature block lives on page 2
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const dateText = formatDate(input.signedDate);
  const textColor = rgb(0.02, 0.1, 0.2);

  const drawLine = (text: string, line: LineBox, size = 11) => {
    const { x, y } = textPos(line);
    page.drawText(text, { x, y, size, font, color: textColor });
  };

  const drawSignature = async (dataUrl: string, line: LineBox) => {
    const png = await pdfDoc.embedPng(dataUrlToBytes(dataUrl));
    const maxWidth = line.x1 - line.x0 - TEXT_PAD_X * 2;
    const maxHeight = 26;
    const scale = Math.min(maxWidth / png.width, maxHeight / png.height);
    const { x, y } = sigPos(line);
    page.drawImage(png, { x, y, width: png.width * scale, height: png.height * scale });
  };

  drawLine(input.guardianName, layout.guardianPrintedLine);
  await drawSignature(input.guardianSignaturePng, layout.guardianSigLine);
  drawLine(dateText, layout.guardianDateLine);

  drawLine(input.studentName, layout.studentPrintedLine);
  await drawSignature(input.studentSignaturePng, layout.studentSigLine);
  drawLine(dateText, layout.studentDateLine);

  return pdfDoc.save();
}
