import { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/supabase/client';
import { Search, MessageCircle, UserPlus } from 'lucide-react';

interface ContactListProps {
  onStartChat: (userId: string) => void;
}

export function ContactList({ onStartChat }: ContactListProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { users } = await apiRequest('/users');
      setContacts(users);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineContacts = filteredContacts.filter(c => c.status === 'online');
  const offlineContacts = filteredContacts.filter(c => c.status !== 'online');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const ContactCard = ({ contact }: { contact: any }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="relative">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
              {contact.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          {contact.status === 'online' && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </div>

        <div>
          <h3 className="text-gray-900 dark:text-white">{contact.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {contact.status === 'online' ? 'En ligne' : 'Hors ligne'}
          </p>
          {contact.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.bio}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => onStartChat(contact.id)}
        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        title="Envoyer un message"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {contacts.length} contact{contacts.length > 1 ? 's' : ''} disponible{contacts.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Online Contacts */}
        {onlineContacts.length > 0 && (
          <div>
            <h2 className="text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              En ligne ({onlineContacts.length})
            </h2>
            <div className="space-y-3">
              {onlineContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </div>
        )}

        {/* Offline Contacts */}
        {offlineContacts.length > 0 && (
          <div>
            <h2 className="text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Hors ligne ({offlineContacts.length})
            </h2>
            <div className="space-y-3">
              {offlineContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </div>
        )}

        {filteredContacts.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun contact trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
