import { useState, useEffect } from 'react';
import { apiRequest, apiRequestWithFile } from '../../utils/supabase/client';
import { Camera, Save, User as UserIcon, AtSign, FileText } from 'lucide-react';

interface ProfileEditorProps {
  userProfile: any;
  onUpdate: () => void;
}

export function ProfileEditor({ userProfile, onUpdate }: ProfileEditorProps) {
  const [name, setName] = useState(userProfile?.name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(userProfile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setPreviewUrl(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Upload avatar if changed
      let avatarUrl = userProfile?.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const { avatar_url } = await apiRequestWithFile('/upload/avatar', formData);
        avatarUrl = avatar_url;
      }

      // Update profile
      await apiRequest('/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          avatar_url: avatarUrl,
        }),
      });

      setSuccess(true);
      onUpdate();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Profil</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl border-4 border-blue-500">
                  {name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
              Cliquez pour changer la photo
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="w-5 h-5" />
                <span>Nom complet</span>
              </div>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              placeholder="Votre nom"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2 mb-2">
                <AtSign className="w-5 h-5" />
                <span>Email</span>
              </div>
            </label>
            <input
              type="email"
              value={userProfile?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5" />
                <span>Bio</span>
              </div>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              placeholder="Parlez-nous de vous..."
              maxLength={200}
            />
            <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
              {bio.length}/200
            </p>
          </div>

          {/* Status Messages */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
              Profil mis à jour avec succès !
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <h3 className="text-gray-900 dark:text-white mb-4">Informations du compte</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Membre depuis</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(userProfile?.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Statut</span>
              <span className="text-green-500">
                {userProfile?.status === 'online' ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
