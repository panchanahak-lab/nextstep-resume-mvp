import type { ResumeData } from '../../../../packages/shared/src/types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 54;
const MARGIN_TOP = 58;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

type PdfPage = {
  commands: string[];
};

type TextOptions = {
  size?: number;
  font?: 'regular' | 'bold';
  gapAfter?: number;
};

const safeText = (value: string) => {
  return value
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapePdfText = (value: string) => {
  return safeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
};

const textWidth = (value: string, fontSize: number) => {
  return safeText(value).length * fontSize * 0.48;
};

const wrapText = (value: string, fontSize: number, maxWidth = CONTENT_WIDTH) => {
  const clean = safeText(value);
  if (!clean) return [];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, fontSize) <= maxWidth) {
      current = next;
      return;
    }

    if (current) lines.push(current);

    if (textWidth(word, fontSize) <= maxWidth) {
      current = word;
      return;
    }

    let chunk = '';
    word.split('').forEach((letter) => {
      const nextChunk = `${chunk}${letter}`;
      if (textWidth(nextChunk, fontSize) <= maxWidth) {
        chunk = nextChunk;
      } else {
        if (chunk) lines.push(chunk);
        chunk = letter;
      }
    });
    current = chunk;
  });

  if (current) lines.push(current);
  return lines;
};

export const downloadPdfUrl = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const createResumePdfBlob = (data: ResumeData) => {
  const pages: PdfPage[] = [{ commands: [] }];
  let currentPage = pages[0];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const ensureSpace = (needed: number) => {
    if (y - needed >= MARGIN_BOTTOM) return;
    currentPage = { commands: [] };
    pages.push(currentPage);
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const drawText = (text: string, x: number, yPosition: number, size = 10, font: 'regular' | 'bold' = 'regular') => {
    if (!safeText(text)) return;
    const fontName = font === 'bold' ? 'F2' : 'F1';
    currentPage.commands.push(`BT /${fontName} ${size} Tf ${x.toFixed(2)} ${yPosition.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`);
  };

  const drawLine = (yPosition: number) => {
    currentPage.commands.push(`0.78 w 0.82 0.85 0.90 RG ${MARGIN_X.toFixed(2)} ${yPosition.toFixed(2)} m ${(PAGE_WIDTH - MARGIN_X).toFixed(2)} ${yPosition.toFixed(2)} l S`);
  };

  const addLines = (lines: string[], options: TextOptions = {}) => {
    const size = options.size ?? 10;
    const font = options.font ?? 'regular';
    const lineHeight = size * 1.45;
    ensureSpace(lines.length * lineHeight + (options.gapAfter ?? 0));
    lines.forEach((line) => {
      drawText(line, MARGIN_X, y, size, font);
      y -= lineHeight;
    });
    y -= options.gapAfter ?? 0;
  };

  const addSection = (title: string) => {
    ensureSpace(34);
    y -= 10;
    drawText(title.toUpperCase(), MARGIN_X, y, 9, 'bold');
    y -= 15;
  };

  const addParagraph = (text: string, gapAfter = 8) => {
    addLines(wrapText(text, 10), { size: 10, gapAfter });
  };

  const addItem = (title: string, subtitle: string, body?: string) => {
    const bodyLines = body ? wrapText(body, 10) : [];
    ensureSpace(32 + bodyLines.length * 14);
    drawText(title, MARGIN_X, y, 10, 'bold');
    y -= 14;
    if (subtitle) {
      drawText(subtitle, MARGIN_X, y, 9);
      y -= 13;
    }
    bodyLines.forEach((line) => {
      drawText(line, MARGIN_X, y, 10);
      y -= 14;
    });
    y -= 7;
  };

  const contact = [data.location, data.email, data.phone].filter(Boolean).join(' | ');

  addLines([data.name || 'Untitled Resume'], { size: 18, font: 'bold', gapAfter: 2 });
  if (data.title) addLines([data.title], { size: 11, font: 'bold', gapAfter: 0 });
  if (contact) addLines([contact], { size: 9, gapAfter: 10 });
  drawLine(y + 3);
  y -= 13;

  if (data.summary) {
    addSection('Summary');
    addParagraph(data.summary, 8);
  }

  if (data.experience?.length) {
    addSection('Experience');
    data.experience
      .filter((exp) => exp.jobTitle || exp.company || exp.description)
      .forEach((exp) => {
        const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
        const subtitle = [exp.company, dateRange].filter(Boolean).join(' | ');
        addItem(exp.jobTitle || 'Experience', subtitle, exp.description);
      });
  }

  if (data.education?.length) {
    addSection('Education');
    data.education
      .filter((edu) => edu.degree || edu.institute || edu.year)
      .forEach((edu) => {
        const subtitle = [edu.institute, edu.year].filter(Boolean).join(' | ');
        addItem(edu.degree || 'Education', subtitle);
      });
  }

  if (data.skills?.length) {
    addSection('Skills');
    addParagraph(data.skills.join('  |  '), 8);
  }

  if (data.projects?.length) {
    addSection('Projects');
    data.projects
      .filter((project) => project.name || project.description || project.tools)
      .forEach((project) => {
        const body = [project.description, project.tools ? `Tools: ${project.tools}` : ''].filter(Boolean).join(' ');
        addItem(project.name || 'Project', '', body);
      });
  }

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const stream = page.commands.join('\n');
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[catalogId - 1] = '<< /Type /Catalog /Pages 2 0 R >>';

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export const getResumePdfFilename = (data: ResumeData) => {
  const filenameBase = safeText(data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume';
  return `${filenameBase}.pdf`;
};
