/// <reference types="vite/client" />

declare module 'pdfjs-dist/legacy/build/pdf.mjs';
declare module 'mammoth/mammoth.browser' {
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
  };

  export default mammoth;
}
