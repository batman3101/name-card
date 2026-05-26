import { createPreviewImage } from './imageProcessing';

export type GeminiCardResult = {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  tags: string;
  memo: string;
  confidence: number;
  rawText: string;
};

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function analyzeBusinessCardWithGemini(file: File, rotation: number): Promise<GeminiCardResult> {
  const image = await createPreviewImage(file, rotation);
  const imageBase64 = await blobToBase64(image);
  const response = await fetch('/api/gemini-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType: image.type || 'image/jpeg',
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Gemini AI scan failed.');
  }

  return payload.contact as GeminiCardResult;
}
