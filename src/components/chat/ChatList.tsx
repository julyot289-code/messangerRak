import { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/supabase/client';
import { Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatListProps {
  onSelectChat: (chat: any) => void;
  onNewChat: () => void;
  selectedChatId: string | null;
  refreshTrigger: number;
}

export function ChatList({ onSelectChat, onNewChat, selectedChatId, refreshTrigger }: ChatListProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, [refreshTrigger]);

  const loadChats = async () => {
    try {
      const { chats: fetchedChats } = await apiRequest('/chats');
      setChats(fetchedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 dark:text-white">Conversations</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            title="Nouvelle conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p>Aucune conversation</p>
            <p className="text-sm mt-2">Cliquez sur + pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedChatId === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {chat.otherUser?.avatar_url ? (
                    <img
                      src={chat.otherUser.avatar_url}
                      alt={chat.otherUser.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                      {chat.otherUser?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {chat.otherUser?.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="truncate text-gray-900 dark:text-white">
                      {chat.otherUser?.name || 'Utilisateur'}
                    </h3>
                    {chat.last_message && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(chat.last_message.timestamp), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    )}
                  </div>
                  {chat.last_message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.last_message.text}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Import missing icon
import { MessageCircle } from 'lucide-react';
