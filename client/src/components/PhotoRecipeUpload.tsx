import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PhotoRecipeUploadProps {
  onExtracted: (data: any) => void;
  onCancel: () => void;
}

export default function PhotoRecipeUpload({ onExtracted, onCancel }: PhotoRecipeUploadProps) {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [method, setMethod] = useState<'ocr' | 'ai'>('ocr');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    for (const file of files) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError(`${file.name}: Endast JPEG och PNG bilder är tillåtna`);
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: Bilden är för stor. Max 10MB.`);
        return;
      }
    }

    setSelectedFiles(files);
    setError('');

    // Create previews for all files
    const newPreviews: string[] = [];
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[index] = reader.result as string;
        if (newPreviews.filter(p => p).length === files.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExtract = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError('');
    setProcessingProgress('');

    try {
      // For AI method with multiple files: send all at once
      if (method === 'ai' && selectedFiles.length > 1) {
        setProcessingProgress(`Bearbetar alla ${selectedFiles.length} bilder samtidigt med AI...`);

        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('photos', file);
        });

        const response = await fetch(`/api/recipes/extract-from-photos?method=ai`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Kunde inte läsa receptet');
        }

        const data = await response.json();
        onExtracted(data);
      } else {
        // For single file or OCR: process files sequentially
        const extractedDataArray = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setProcessingProgress(`Bearbetar bild ${i + 1} av ${selectedFiles.length}...`);

          const formData = new FormData();
          formData.append('photo', file);

          const response = await fetch(`/api/recipes/extract-from-photo?method=${method}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Kunde inte läsa bild ${i + 1}`);
          }

          const data = await response.json();
          extractedDataArray.push(data);
        }

        // Combine results from multiple photos (for OCR)
        const combinedData = combineExtractedData(extractedDataArray);
        onExtracted(combinedData);
      }
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid bildbehandling');
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  const combineExtractedData = (dataArray: any[]) => {
    if (dataArray.length === 1) {
      return dataArray[0];
    }

    // Use the first photo's metadata as base
    const combined = { ...dataArray[0] };

    // Combine instructions from all photos
    const allInstructions = dataArray
      .map(d => d.instructions)
      .filter(inst => inst && inst.trim().length > 0)
      .join('\n\n');
    combined.instructions = allInstructions;

    // Merge ingredients (avoid duplicates)
    const ingredientMap = new Map();
    dataArray.forEach(data => {
      if (data.ingredients) {
        data.ingredients.forEach((ing: any) => {
          const key = `${ing.ingredientId || ing.matchedName}-${ing.unitId}`;
          if (ingredientMap.has(key)) {
            // If ingredient exists, add quantities
            const existing = ingredientMap.get(key);
            existing.quantity += ing.quantity;
          } else {
            ingredientMap.set(key, { ...ing });
          }
        });
      }
    });
    combined.ingredients = Array.from(ingredientMap.values());

    // Combine descriptions
    const allDescriptions = dataArray
      .map(d => d.description)
      .filter(desc => desc && desc.trim().length > 0)
      .join(' ');
    combined.description = allDescriptions;

    return combined;
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
              Välj bilder av recept (en eller flera)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
              multiple
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            {selectedFiles.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'bild vald' : 'bilder valda'}
              </p>
            )}
          </div>

          {/* Preview */}
          {previews.length > 0 && (
            <div className="mt-4">
              <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <span className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
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
              disabled={selectedFiles.length === 0 || isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? 'Läser recept...'
                : selectedFiles.length > 1
                  ? `Läs recept från ${selectedFiles.length} foton`
                  : 'Läs recept från foto'}
            </button>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="text-center text-sm text-gray-600">
              <div className="animate-pulse">
                {processingProgress && <div className="font-semibold mb-1">{processingProgress}</div>}
                <div>
                  {method === 'ai'
                    ? selectedFiles.length > 1
                      ? 'AI analyserar alla bilder tillsammans... Detta kan ta 10-20 sekunder.'
                      : 'AI läser receptet... Detta kan ta 5-15 sekunder.'
                    : selectedFiles.length > 1
                      ? 'OCR läser receptet... Detta kan ta 10-30 sekunder per bild.'
                      : 'OCR läser receptet... Detta kan ta 10-30 sekunder.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
