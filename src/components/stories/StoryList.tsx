import { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/supabase/client';
import { Plus, Play } from 'lucide-react';

interface StoryListProps {
  onCreateStory: () => void;
  onViewStory: (userStories: any) => void;
  currentUserId: string;
}

export function StoryList({ onCreateStory, onViewStory, currentUserId }: StoryListProps) {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
    
    // Refresh stories every 10 seconds
    const interval = setInterval(loadStories, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStories = async () => {
    try {
      const { stories: fetchedStories } = await apiRequest('/stories');
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const myStories = stories.find(s => s.user?.id === currentUserId);
  const otherStories = stories.filter(s => s.user?.id !== currentUserId);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Stories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Partagez vos moments avec vos amis
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Create Story Card */}
          <button
            onClick={onCreateStory}
            className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm">Créer une story</span>
          </button>

          {/* My Stories */}
          {myStories && (
            <button
              onClick={() => onViewStory(myStories)}
              className="aspect-[9/16] rounded-2xl relative overflow-hidden group hover:scale-105 transition-transform shadow-lg"
            >
              {myStories.stories[0]?.media_url ? (
                <img
                  src={myStories.stories[0].media_url}
                  alt="Ma story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white p-4">
                  <p className="text-center">{myStories.stories[0]?.text}</p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                <div className="flex items-center space-x-2">
                  {myStories.user?.avatar_url ? (
                    <img
                      src={myStories.user.avatar_url}
                      alt={myStories.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white border-2 border-blue-500">
                      {myStories.user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-white text-sm">Ma story</p>
                    <p className="text-white/70 text-xs">
                      {myStories.stories.length} histoire{myStories.stories.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>
            </button>
          )}

          {/* Other Users' Stories */}
          {otherStories.map((userStory) => (
            <button
              key={userStory.user.id}
              onClick={() => onViewStory(userStory)}
              className="aspect-[9/16] rounded-2xl relative overflow-hidden group hover:scale-105 transition-transform shadow-lg"
            >
              {userStory.stories[0]?.media_url ? (
                <img
                  src={userStory.stories[0].media_url}
                  alt={`Story de ${userStory.user.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white p-4">
                  <p className="text-center line-clamp-6">{userStory.stories[0]?.text}</p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                <div className="flex items-center space-x-2">
                  {userStory.user?.avatar_url ? (
                    <img
                      src={userStory.user.avatar_url}
                      alt={userStory.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white border-2 border-blue-500">
                      {userStory.user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-white text-sm">{userStory.user?.name}</p>
                    <p className="text-white/70 text-xs">
                      {userStory.stories.length} histoire{userStory.stories.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucune story disponible</p>
            <p className="text-sm mt-2">Soyez le premier à partager !</p>
          </div>
        )}
      </div>
    </div>
  );
}
