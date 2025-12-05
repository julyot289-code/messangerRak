import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { apiRequest } from '../../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoryViewerProps {
  userStories: any;
  onClose: () => void;
  currentUserId: string;
}

export function StoryViewer({ userStories, onClose, currentUserId }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = userStories.stories[currentIndex];
  const isOwn = userStories.user.id === currentUserId;

  useEffect(() => {
    // Mark story as viewed
    if (!isOwn) {
      apiRequest('/stories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userStories.user.id,
          storyId: currentStory.id
        }),
      }).catch(console.error);
    }
  }, [currentIndex]);

  useEffect(() => {
    setProgress(0);
    
    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < userStories.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {userStories.stories.map((_: any, index: number) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          {userStories.user.avatar_url ? (
            <img
              src={userStories.user.avatar_url}
              alt={userStories.user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white border-2 border-white">
              {userStories.user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-white">{userStories.user.name}</h3>
            <p className="text-white/70 text-sm">
              {formatDistanceToNow(new Date(currentStory.timestamp), {
                addSuffix: true,
                locale: fr
              })}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden">
        {currentStory.media_url ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center p-8">
            <p className="text-white text-center text-2xl">{currentStory.text}</p>
          </div>
        )}

        {currentStory.media_url && currentStory.text && (
          <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-center text-xl">{currentStory.text}</p>
          </div>
        )}

        {/* Navigation Areas */}
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
          disabled={currentIndex === 0}
        />
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        />

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {currentIndex < userStories.stories.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Views Count (for own stories) */}
      {isOwn && currentStory.views.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
          <Eye className="w-5 h-5 text-white" />
          <span className="text-white">
            {currentStory.views.length} vue{currentStory.views.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
