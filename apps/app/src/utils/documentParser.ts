import mammoth from 'mammoth';

export interface ParseResult {
  text: string;
  warning?: string;
}

/**
 * Extract text from PDF or DOCX files.
 * Returns a ParseResult with extracted text and an optional warning.
 * Never throws a hard error — returns a warning message instead so the
 * user can fall back to pasting text manually.
 */
export const extractTextFromFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return await extractTextFromPdf(file);
  } else if (extension === 'docx') {
    return await extractTextFromDocx(file);
  } else {
    return { text: '', warning: 'Unsupported file format. Please upload a PDF or DOCX file.' };
  }
};

const extractTextFromPdf = async (file: File): Promise<ParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import pdfjs-dist to avoid worker configuration issues
    const pdfjsLib = await import('pdfjs-dist');

    // Configure the worker using a CDN-hosted worker script.
    // This avoids bundler issues with the local worker file.
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => {
            // item.str contains the text, item.hasEOL indicates end-of-line
            const str = item.str ?? '';
            return item.hasEOL ? str + '\n' : str;
          })
          .join('');
        pageTexts.push(pageText);
      } catch (pageError) {
        // If a single page fails, continue with others
        console.warn(`Failed to extract text from page ${i}:`, pageError);
      }
    }

    const fullText = pageTexts.join('\n').trim();

    if (!fullText) {
      return {
        text: '',
        warning: 'We had trouble reading your PDF. You can paste your resume text below instead.',
      };
    }

    return { text: fullText };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return {
      text: '',
      warning: 'We had trouble reading your PDF. You can paste your resume text below instead.',
    };
  }
};

const extractTextFromDocx = async (file: File): Promise<ParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      return {
        text: '',
        warning: 'We had trouble reading your DOCX file. You can paste your resume text below instead.',
      };
    }

    return { text };
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return {
      text: '',
      warning: 'We had trouble reading your DOCX file. You can paste your resume text below instead.',
    };
  }
};
