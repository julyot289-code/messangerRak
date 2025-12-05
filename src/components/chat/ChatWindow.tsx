import { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../../utils/supabase/client';
import { Send, Smile, MoreVertical, Phone, Video, ArrowLeft } from 'lucide-react';
import { Message } from './Message';

interface ChatWindowProps {
  chat: any;
  currentUserId: string;
  onBack: () => void;
  onRefresh: () => void;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export function ChatWindow({ chat, currentUserId, onBack, onRefresh }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number>();

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds
    pollIntervalRef.current = window.setInterval(() => {
      loadMessages();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { messages: fetchedMessages } = await apiRequest(`/messages/${chat.id}`);
      setMessages(fetchedMessages.filter((msg: any) => 
        !msg.deletedFor?.includes(currentUserId)
      ));
      
      // Mark messages as seen
      for (const message of fetchedMessages) {
        if (message.senderId !== currentUserId && !message.seen) {
          await apiRequest('/messages/seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: chat.id, messageId: message.id }),
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage('');

    try {
      await apiRequest('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, text: messageText }),
      });

      await loadMessages();
      onRefresh();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await apiRequest('/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, messageId, emoji }),
      });
      await loadMessages();
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      await apiRequest('/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, messageId, deleteForEveryone }),
      });
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="relative">
            {chat.otherUser?.avatar_url ? (
              <img
                src={chat.otherUser.avatar_url}
                alt={chat.otherUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                {chat.otherUser?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {chat.otherUser?.status === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white">
              {chat.otherUser?.name || 'Utilisateur'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chat.otherUser?.status === 'online' ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-blue-600">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-blue-600">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onReact={(emoji) => handleReaction(message.id, emoji)}
              onDelete={(deleteForEveryone) => handleDeleteMessage(message.id, deleteForEveryone)}
              emojiOptions={EMOJI_REACTIONS}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          >
            <Smile className="w-6 h-6" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
