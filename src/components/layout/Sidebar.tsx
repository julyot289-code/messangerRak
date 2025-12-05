import { MessageCircle, Users, Film, Settings, LogOut, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  theme: string;
  onThemeToggle: () => void;
  onLogout: () => void;
  userProfile: any;
}

export function Sidebar({ currentView, onViewChange, theme, onThemeToggle, onLogout, userProfile }: SidebarProps) {
  const menuItems = [
    { id: 'chats', icon: MessageCircle, label: 'Conversations' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'stories', icon: Film, label: 'Stories' },
    { id: 'profile', icon: Settings, label: 'Profil' },
  ];

  return (
    <div className="w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 space-y-6">
      {/* Logo */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
        <MessageCircle className="w-8 h-8 text-white" />
      </div>

      {/* User Avatar */}
      <div className="relative">
        {userProfile?.avatar_url ? (
          <img
            src={userProfile.avatar_url}
            alt={userProfile.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
            {userProfile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
          userProfile?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col space-y-4 pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onThemeToggle}
        className="p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
      >
        {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        title="Déconnexion"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </div>
  );
}
