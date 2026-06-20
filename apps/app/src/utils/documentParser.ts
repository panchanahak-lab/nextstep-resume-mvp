export interface ParseResult {
  text: string;
  warning?: string;
}

/**
 * Extract text from PDF or DOCX files via backend API.
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
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3005/parse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.warn('Backend parsing failed with status:', response.status);
      return {
        text: '',
        warning: 'We could not read your file. Please paste your resume text below instead.',
      };
    }

    const data = await response.json();

    if (!data.text) {
      return {
        text: '',
        warning: 'We could not read your file. Please paste your resume text below instead.',
      };
    }

    return { text: data.text };
  } catch (error) {
    console.error('Error extracting text via API:', error);
    return {
      text: '',
      warning: 'We could not read your file. Please paste your resume text below instead.',
    };
  }
};
