import { jsPDF } from 'jspdf';
import { PuzzleDefinition } from '../types';

export interface PdfExportOptions {
  title?: string;
  puzzlesPerPage: 1 | 2 | 4;
  includeSolutions: boolean;
  paperSize?: 'a4' | 'letter';
}

/**
 * Draws a single Kemaru/Suguru grid onto the jsPDF context at (startX, startY) with given width/height
 */
function drawGridOnPdf(
  doc: jsPDF,
  puzzle: PuzzleDefinition,
  startX: number,
  startY: number,
  gridWidth: number,
  gridHeight: number,
  isSolution: boolean = false
) {
  const { rows, cols, cellCageMap, clues, solution } = puzzle;
  const cellW = gridWidth / cols;
  const cellH = gridHeight / rows;

  // Background box
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setFillColor(255, 255, 255);
  doc.rect(startX, startY, gridWidth, gridHeight, 'FD');

  // Draw thin inner grid lines
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  for (let r = 1; r < rows; r++) {
    doc.line(startX, startY + r * cellH, startX + gridWidth, startY + r * cellH);
  }
  for (let c = 1; c < cols; c++) {
    doc.line(startX + c * cellW, startY, startX + c * cellW, startY + gridHeight);
  }

  // Draw thick cage borders
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);

  // Outer boundary of whole grid
  doc.rect(startX, startY, gridWidth, gridHeight, 'S');

  // Internal cage boundaries:
  // Horizontal borders: if cellCageMap[r][c] !== cellCageMap[r+1][c]
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (cellCageMap[r][c] !== cellCageMap[r + 1][c]) {
        doc.line(
          startX + c * cellW,
          startY + (r + 1) * cellH,
          startX + (c + 1) * cellW,
          startY + (r + 1) * cellH
        );
      }
    }
  }

  // Vertical borders: if cellCageMap[r][c] !== cellCageMap[r][c+1]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (cellCageMap[r][c] !== cellCageMap[r][c + 1]) {
        doc.line(
          startX + (c + 1) * cellW,
          startY + r * cellH,
          startX + (c + 1) * cellW,
          startY + (r + 1) * cellH
        );
      }
    }
  }

  // Draw numbers (clues or full solution)
  doc.setFont('helvetica', isSolution ? 'normal' : 'bold');
  const fontSize = Math.max(8, Math.min(18, Math.floor(cellH * 1.5)));
  doc.setFontSize(fontSize);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = isSolution ? solution[r][c] : clues[r][c];
      if (val > 0) {
        if (!isSolution) {
          doc.setTextColor(15, 23, 42); // Black / dark slate
        } else {
          // In solutions: distinguish initial clues from solved digits
          if (clues[r][c] > 0) {
            doc.setTextColor(15, 23, 42); // bold initial clue
          } else {
            doc.setTextColor(71, 85, 105); // softer slate for solved
          }
        }
        const textX = startX + c * cellW + cellW / 2;
        // Adjust baseline for vertical centering in jsPDF
        const textY = startY + r * cellH + cellH / 2 + (fontSize * 0.35 * 0.3527);
        doc.text(String(val), textX, textY, { align: 'center' });
      }
    }
  }
}

export function exportPuzzlesToPdf(
  puzzles: PuzzleDefinition[],
  options: PdfExportOptions = { puzzlesPerPage: 2, includeSolutions: true }
): void {
  if (!puzzles || puzzles.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.paperSize || 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 20;
  const marginBottom = 18;
  const usableWidth = pageWidth - marginX * 2;
  const usableHeight = pageHeight - marginTop - marginBottom;

  const puzzlesPerPage = options.puzzlesPerPage;
  const totalPuzzlePages = Math.ceil(puzzles.length / puzzlesPerPage);

  // 1. Draw Puzzles
  for (let pageIdx = 0; pageIdx < totalPuzzlePages; pageIdx++) {
    if (pageIdx > 0) doc.addPage();

    // Page Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(options.title || 'Suguru / Kemaru / Tectonic Puzzles', marginX, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Rules: Each block of size N contains 1..N. Identical numbers cannot touch, even diagonally.', marginX, 16);

    const startPuzzleIdx = pageIdx * puzzlesPerPage;
    const pagePuzzles = puzzles.slice(startPuzzleIdx, startPuzzleIdx + puzzlesPerPage);

    if (puzzlesPerPage === 1) {
      const p = pagePuzzles[0];
      const maxDim = Math.min(usableWidth, usableHeight - 35);
      const cellSize = maxDim / Math.max(p.rows, p.cols);
      const gridW = cellSize * p.cols;
      const gridH = cellSize * p.rows;
      const posX = marginX + (usableWidth - gridW) / 2;
      const posY = marginTop + 10 + (usableHeight - gridH) / 2;

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `Puzzle #${startPuzzleIdx + 1}  •  ${p.rows}×${p.cols}  •  Difficulty: ${p.difficulty.toUpperCase()}  (${p.clueCount} clues)`,
        posX,
        posY - 5
      );

      drawGridOnPdf(doc, p, posX, posY, gridW, gridH, false);
    } else if (puzzlesPerPage === 2) {
      // 2 stacked vertically
      const slotH = usableHeight / 2;
      pagePuzzles.forEach((p, idx) => {
        const slotY = marginTop + idx * slotH;
        const maxW = usableWidth * 0.85;
        const maxH = slotH - 24;
        const cellSize = Math.min(maxW / p.cols, maxH / p.rows);
        const gridW = cellSize * p.cols;
        const gridH = cellSize * p.rows;
        const posX = marginX + (usableWidth - gridW) / 2;
        const posY = slotY + 14;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `Puzzle #${startPuzzleIdx + idx + 1}  •  ${p.rows}×${p.cols}  •  Difficulty: ${p.difficulty.toUpperCase()}`,
          posX,
          posY - 4
        );

        drawGridOnPdf(doc, p, posX, posY, gridW, gridH, false);
      });
    } else {
      // 4 puzzles in 2x2 grid
      const colW = usableWidth / 2;
      const rowH = usableHeight / 2;

      pagePuzzles.forEach((p, idx) => {
        const cIdx = idx % 2;
        const rIdx = Math.floor(idx / 2);
        const cellStartX = marginX + cIdx * colW;
        const cellStartY = marginTop + rIdx * rowH;

        const maxW = colW - 12;
        const maxH = rowH - 20;
        const cellSize = Math.min(maxW / p.cols, maxH / p.rows);
        const gridW = cellSize * p.cols;
        const gridH = cellSize * p.rows;
        const posX = cellStartX + (colW - gridW) / 2;
        const posY = cellStartY + 14;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `#${startPuzzleIdx + idx + 1} (${p.difficulty.slice(0, 4).toUpperCase()})`,
          posX,
          posY - 3
        );

        drawGridOnPdf(doc, p, posX, posY, gridW, gridH, false);
      });
    }

    // Page footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${pageIdx + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // 2. Solutions Section (if requested)
  if (options.includeSolutions) {
    const solPerPage = 6; // 6 solutions per page (2 columns x 3 rows)
    const totalSolPages = Math.ceil(puzzles.length / solPerPage);

    for (let solPageIdx = 0; solPageIdx < totalSolPages; solPageIdx++) {
      doc.addPage();

      // Solutions header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Solutions & Answer Keys', marginX, 14);

      const startSolIdx = solPageIdx * solPerPage;
      const pageSols = puzzles.slice(startSolIdx, startSolIdx + solPerPage);

      const colW = usableWidth / 2;
      const rowH = (usableHeight - 8) / 3;

      pageSols.forEach((p, idx) => {
        const cIdx = idx % 2;
        const rIdx = Math.floor(idx / 2);
        const cellStartX = marginX + cIdx * colW;
        const cellStartY = marginTop + rIdx * rowH;

        const maxW = colW - 14;
        const maxH = rowH - 18;
        const cellSize = Math.min(maxW / p.cols, maxH / p.rows);
        const gridW = cellSize * p.cols;
        const gridH = cellSize * p.rows;
        const posX = cellStartX + (colW - gridW) / 2;
        const posY = cellStartY + 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`Solution #${startSolIdx + idx + 1} (${p.rows}×${p.cols})`, posX, posY - 2);

        drawGridOnPdf(doc, p, posX, posY, gridW, gridH, true);
      });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Solutions • Page ${solPageIdx + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  // Save the PDF
  doc.save(`suguru-puzzles-${Date.now()}.pdf`);
}
