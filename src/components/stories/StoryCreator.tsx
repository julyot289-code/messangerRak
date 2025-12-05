import { useState } from 'react';
import { apiRequestWithFile } from '../../utils/supabase/client';
import { X, Image as ImageIcon, Type, Upload } from 'lucide-react';

interface StoryCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function StoryCreator({ onClose, onSuccess }: StoryCreatorProps) {
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setStoryType('image');
    }
  };

  const handleCreateStory = async () => {
    if (!text && !file) {
      setError('Ajoutez du texte ou une image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
        formData.append('type', 'image');
      } else {
        formData.append('type', 'text');
      }
      formData.append('text', text);

      await apiRequestWithFile('/stories/create', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(err.message || 'Échec de la création de la story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl">Créer une story</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setStoryType('text')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors ${
              storyType === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Type className="w-5 h-5" />
            <span>Texte</span>
          </button>
          <button
            onClick={() => setStoryType('image')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors ${
              storyType === 'image'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Image</span>
          </button>
        </div>

        {/* Preview Area */}
        <div className="aspect-[9/16] bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl overflow-hidden mb-6 relative">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrivez quelque chose..."
                className="w-full h-full bg-transparent text-white text-center text-2xl placeholder-white/70 resize-none focus:outline-none"
                maxLength={200}
              />
            </div>
          )}

          {previewUrl && text && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/30">
              <p className="text-white text-center text-2xl">{text}</p>
            </div>
          )}
        </div>

        {/* File Upload */}
        {storyType === 'image' && !previewUrl && (
          <label className="block mb-6">
            <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 transition-colors">
              <Upload className="w-12 h-12 text-white/70 mx-auto mb-3" />
              <p className="text-white/70 mb-1">Cliquez pour choisir une image</p>
              <p className="text-white/50 text-sm">JPG, PNG, GIF</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Text Input for Image Stories */}
        {previewUrl && (
          <div className="mb-6">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ajoutez une légende (optionnel)"
              className="w-full px-4 py-3 bg-white/10 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreateStory}
            disabled={loading || (!text && !file)}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
