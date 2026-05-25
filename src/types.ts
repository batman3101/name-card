export type Contact = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  tags: string;
  memo: string;
  sourceText: string;
  confidence: number;
};

export type OcrStatus = {
  label: string;
  progress: number;
};
