export type StoredObject = {
  bucket: string;
  contentType: string;
  etag: string | null;
  key: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type StoreObjectInput = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
};

export interface FileStorageProvider {
  deleteObject(object: Pick<StoredObject, "bucket" | "key">): Promise<void>;
  storeExpenseRequestPdf(input: StoreObjectInput): Promise<StoredObject>;
}
