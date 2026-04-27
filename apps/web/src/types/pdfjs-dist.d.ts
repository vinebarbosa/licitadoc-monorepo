declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export const getDocument: unknown;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare module "pdfjs-dist/legacy/build/pdf.worker.mjs?url" {
  const workerSrc: string;
  export default workerSrc;
}
