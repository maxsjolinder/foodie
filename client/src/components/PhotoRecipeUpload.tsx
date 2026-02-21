import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PhotoRecipeUploadProps {
  onExtracted: (data: any) => void;
  onCancel: () => void;
}

export default function PhotoRecipeUpload({ onExtracted, onCancel }: PhotoRecipeUploadProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [method, setMethod] = useState<'ocr' | 'ai'>('ocr');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Endast JPEG och PNG bilder är tillåtna');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Bilden är för stor. Max 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch(`/api/recipes/extract-from-photo?method=${method}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunde inte läsa receptet');
      }

      const data = await response.json();
      onExtracted(data);
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid bildbehandling');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Skapa recept från foto</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Extraction method selector */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Extraheringsmetod
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="ocr"
                  checked={method === 'ocr'}
                  onChange={(e) => setMethod(e.target.value as 'ocr')}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium text-sm">OCR (Gratis)</span>
                  <p className="text-xs text-gray-500">Fungerar bäst med tydlig, tryckt text</p>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="ai"
                  checked={method === 'ai'}
                  onChange={(e) => setMethod(e.target.value as 'ai')}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium text-sm">AI (Claude) 🤖</span>
                  <p className="text-xs text-gray-500">Mer exakt, hanterar handskrivet. Kräver API-nyckel.</p>
                </div>
              </label>
            </div>
          </div>

          {/* File input */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Välj bild av recept
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-96 mx-auto rounded-lg border"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleExtract}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Läser recept...' : 'Läs recept från foto'}
            </button>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="text-center text-sm text-gray-600">
              <div className="animate-pulse">
                {method === 'ai'
                  ? 'AI läser receptet... Detta kan ta 5-15 sekunder.'
                  : 'OCR läser receptet... Detta kan ta 10-30 sekunder.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
