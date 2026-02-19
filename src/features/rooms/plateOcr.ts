import Tesseract from 'tesseract.js';

export async function readPlateFromImageDataUrl(photoDataUrl: string): Promise<string> {
  // OCR básico
  const { data } = await Tesseract.recognize(photoDataUrl, 'eng', {
    logger: () => {},
  });

  const raw = (data?.text ?? '').toUpperCase();

  // Normaliza: solo A-Z0-9
  const cleaned = raw.replace(/[^A-Z0-9]/g, ' ');

  // Heurística simple:
  // busca “tokens” de 5 a 8 chars (placas suelen caer ahí)
  const candidates = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 5 && t.length <= 8);

  // elige el candidato “más probable”: más largo primero
  candidates.sort((a, b) => b.length - a.length);

  return candidates[0] ?? '';
}
