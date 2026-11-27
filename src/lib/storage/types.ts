export type StoredObject = {
  key: string;
  url: string;
  size: number;
  mimeType: string;
};

export type StorageProvider = {
  upload(params: {
    key: string;
    data: Buffer;
    mimeType: string;
  }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
};
