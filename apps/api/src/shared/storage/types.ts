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

export type StoreSupportImageInput = StoreObjectInput & {
  uploadedByUserId: string;
};

export type StoreOrganizationLetterheadInput = StoreObjectInput & {
  organizationId: string;
};

export const ORGANIZATION_LETTERHEAD_FILE_NAME = "papel-timbrado";

export function getOrganizationLetterheadStorageKey(organizationId: string) {
  return `organization-letterheads/${organizationId}/${ORGANIZATION_LETTERHEAD_FILE_NAME}`;
}

export type StoredObjectContent = {
  body: NodeJS.ReadableStream;
  contentLength: number | null;
  contentType: string | null;
};

export interface FileStorageProvider {
  deleteObject(object: Pick<StoredObject, "bucket" | "key">): Promise<void>;
  getObject(object: Pick<StoredObject, "key">): Promise<StoredObjectContent>;
  storeExpenseRequestPdf(input: StoreObjectInput): Promise<StoredObject>;
  storeOrganizationLetterhead(input: StoreOrganizationLetterheadInput): Promise<StoredObject>;
  storeSupportTicketImage(input: StoreSupportImageInput): Promise<StoredObject>;
}
