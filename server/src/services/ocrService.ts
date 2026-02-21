import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export class OCRService {
  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
      // Preprocess image for better OCR accuracy
      const preprocessed = await sharp(imageBuffer)
        .grayscale() // Convert to grayscale
        .normalize() // Improve contrast
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      // Run Tesseract OCR
      const { data } = await Tesseract.recognize(
        preprocessed,
        'eng', // English language model
        {
          logger: (m) => console.log(m), // Log progress
        }
      );

      return data.text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
}
