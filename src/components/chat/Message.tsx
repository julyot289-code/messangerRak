import { useState } from 'react';
import { MoreVertical, Trash2, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageProps {
  message: any;
  isOwn: boolean;
  onReact: (emoji: string) => void;
  onDelete: (deleteForEveryone: boolean) => void;
  emojiOptions: string[];
}

export function Message({ message, isOwn, onReact, onDelete, emojiOptions }: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="relative">
          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              message.deleted
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic'
                : isOwn
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            <p className="break-words">{message.text}</p>
          </div>

          {/* Action Buttons */}
          {!message.deleted && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2`}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-600 dark:text-gray-400"
                title="Réagir"
              >
                <Smile className="w-4 h-4" />
              </button>

              {isOwn && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-600 dark:text-gray-400"
                    title="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[200px]">
                      <button
                        onClick={() => {
                          onDelete(false);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Supprimer pour moi</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer pour tous</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactions && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1 flex space-x-1 z-10`}>
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setShowReactions(false);
                  }}
                  className="hover:scale-125 transition-transform text-xl p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reactions Display */}
          {reactionEntries.length > 0 && (
            <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {[...new Set(Object.values(reactions))].map((emoji) => {
                const count = Object.values(reactions).filter(e => e === emoji).length;
                return (
                  <div
                    key={emoji as string}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5 text-xs flex items-center space-x-1"
                  >
                    <span>{emoji as string}</span>
                    {count > 1 && <span className="text-gray-600 dark:text-gray-400">{count}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timestamp and Status */}
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span>
            {formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
              locale: fr
            })}
          </span>
          {isOwn && message.seen && <span>Vu</span>}
        </div>
      </div>
    </div>
  );
}

// Import missing icon
import { Smile } from 'lucide-react';
