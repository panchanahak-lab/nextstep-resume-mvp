import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface ParseResult {
  text: string;
  warning?: string;
}

const READ_WARNING = 'We could not read your file. Please paste your resume text below instead.';

const extractPdfText = async (file: File): Promise<string> => {
  // Loaded on demand so the heavy pdf.js bundle isn't part of the initial page load.
  const pdfjsLib = await import('pdfjs-dist');
  // pdf.js needs its worker. Vite bundles it and gives us a URL we can point to,
  // so parsing works on static hosting (e.g. Vercel) without any backend server.
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  await pdf.cleanup();
  return pageTexts.join('\n').replace(/[ \t]+/g, ' ').trim();
};

const extractDocxText = async (file: File): Promise<string> => {
  // Loaded on demand to keep it out of the initial page bundle.
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value ?? '').trim();
};

/**
 * Extract text from a PDF or DOCX file entirely in the browser.
 * Returns a ParseResult with extracted text and an optional warning.
 * Never throws a hard error — returns a warning message instead so the
 * user can fall back to pasting text manually.
 */
export const extractTextFromFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension !== 'pdf' && extension !== 'docx') {
    return { text: '', warning: 'Unsupported file format. Please upload a PDF or DOCX file.' };
  }

  try {
    const text = extension === 'pdf' ? await extractPdfText(file) : await extractDocxText(file);

    if (!text) {
      // Most often a scanned/image-only PDF with no selectable text.
      return { text: '', warning: READ_WARNING };
    }

    return { text };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return { text: '', warning: READ_WARNING };
  }
};
