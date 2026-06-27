import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import mammoth from 'mammoth/mammoth.browser';

export interface ParseResult {
  text: string;
  warning?: string;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const unreadableFileWarning = 'We could not read your file. Please paste your resume text below instead.';

const extractPdfText = async (file: File) => {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) pages.push(pageText);
  }

  return pages.join('\n\n').trim();
};

const extractDocxText = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

/**
 * Extract text from PDF or DOCX files in the browser.
 * Returns a ParseResult with extracted text and an optional warning.
 * Never throws a hard error, so users can still paste text manually.
 */
export const extractTextFromFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension !== 'pdf' && extension !== 'docx') {
    return { text: '', warning: 'Unsupported file format. Please upload a PDF or DOCX file.' };
  }

  try {
    const text = extension === 'pdf'
      ? await extractPdfText(file)
      : await extractDocxText(file);

    if (!text) {
      return { text: '', warning: unreadableFileWarning };
    }

    return { text };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return { text: '', warning: unreadableFileWarning };
  }
};
