import { useState, useEffect } from 'react';
import { supabase, apiRequest } from './utils/supabase/client';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Sidebar } from './components/layout/Sidebar';
import { ChatList } from './components/chat/ChatList';
import { ChatWindow } from './components/chat/ChatWindow';
import { ContactList } from './components/contacts/ContactList';
import { StoryList } from './components/stories/StoryList';
import { StoryCreator } from './components/stories/StoryCreator';
import { StoryViewer } from './components/stories/StoryViewer';
import { ProfileEditor } from './components/profile/ProfileEditor';

type View = 'chats' | 'contacts' | 'stories' | 'profile';
type AuthView = 'login' | 'signup';

export default function App() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('chats');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [viewingStory, setViewingStory] = useState<any>(null);
  const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
      updateUserStatus('online');

      // Update status on window close
      const handleBeforeUnload = () => {
        updateUserStatus('offline');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isAuthenticated]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { profile } = await apiRequest('/profile');
      setUserProfile(profile);
      setTheme(profile.theme || 'light');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateUserStatus = async (status: string) => {
    try {
      await apiRequest('/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogin = async () => {
    setIsAuthenticated(true);
    await loadUserProfile();
  };

  const handleLogout = async () => {
    await updateUserStatus('offline');
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setSelectedChat(null);
    setCurrentView('chats');
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (userProfile) {
      try {
        await apiRequest('/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const { chat } = await apiRequest('/chats/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: userId }),
      });

      // Get other user's profile
      const { user: otherUser } = await apiRequest(`/users/${userId}`);
      
      setSelectedChat({
        ...chat,
        otherUser
      });
      setCurrentView('chats');
      setChatRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentView('contacts');
  };

  const handleChatRefresh = () => {
    setChatRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login
          onSuccess={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      );
    } else {
      return (
        <Signup
          onSuccess={() => setAuthView('login')}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view as View);
          if (view !== 'chats') {
            setSelectedChat(null);
          }
        }}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
        userProfile={userProfile}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {currentView === 'chats' && (
          <>
            <ChatList
              onSelectChat={setSelectedChat}
              onNewChat={handleNewChat}
              selectedChatId={selectedChat?.id || null}
              refreshTrigger={chatRefreshTrigger}
            />
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                currentUserId={userProfile?.id}
                onBack={() => setSelectedChat(null)}
                onRefresh={handleChatRefresh}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-32 h-32 mx-auto mb-4 opacity-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-xl mb-2">Sélectionnez une conversation</p>
                  <p className="text-sm">Choisissez une conversation pour commencer à discuter</p>
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'contacts' && (
          <ContactList onStartChat={handleStartChat} />
        )}

        {currentView === 'stories' && (
          <StoryList
            onCreateStory={() => setShowStoryCreator(true)}
            onViewStory={setViewingStory}
            currentUserId={userProfile?.id}
          />
        )}

        {currentView === 'profile' && (
          <ProfileEditor
            userProfile={userProfile}
            onUpdate={loadUserProfile}
          />
        )}
      </div>

      {/* Story Creator Modal */}
      {showStoryCreator && (
        <StoryCreator
          onClose={() => setShowStoryCreator(false)}
          onSuccess={() => {
            setShowStoryCreator(false);
            // Refresh stories if on stories view
            if (currentView === 'stories') {
              window.location.reload();
            }
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          userStories={viewingStory}
          onClose={() => setViewingStory(null)}
          currentUserId={userProfile?.id}
        />
      )}
    </div>
  );
}
