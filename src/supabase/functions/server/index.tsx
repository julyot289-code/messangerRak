import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize storage buckets
const initializeStorage = async () => {
  const buckets = [
    { name: 'make-0d6c4efa-avatars', public: true },
    { name: 'make-0d6c4efa-stories', public: false },
    { name: 'make-0d6c4efa-media', public: false }
  ];

  const { data: existingBuckets } = await supabase.storage.listBuckets();
  
  for (const bucket of buckets) {
    const exists = existingBuckets?.some(b => b.name === bucket.name);
    if (!exists) {
      await supabase.storage.createBucket(bucket.name, { public: bucket.public });
      console.log(`Created bucket: ${bucket.name}`);
    }
  }
};

initializeStorage();

// ========== AUTHENTICATION ROUTES ==========

// Signup
app.post('/make-server-0d6c4efa/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      bio: '',
      avatar_url: '',
      status: 'online',
      theme: 'light',
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    // Add to users list
    const usersList = await kv.get('users:list') || [];
    if (!usersList.includes(data.user.id)) {
      await kv.set('users:list', [...usersList, data.user.id]);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Get current user profile
app.get('/make-server-0d6c4efa/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Get profile error: ${error}`);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update profile
app.post('/make-server-0d6c4efa/profile/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      id: user.id,
      email: currentProfile.email
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.log(`Update profile error: ${error}`);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Upload avatar
app.post('/make-server-0d6c4efa/upload/avatar', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data, error: uploadError } = await supabase.storage
      .from('make-0d6c4efa-avatars')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.log(`Avatar upload error: ${uploadError.message}`);
      return c.json({ error: uploadError.message }, 400);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('make-0d6c4efa-avatars')
      .getPublicUrl(fileName);

    // Update profile
    const currentProfile = await kv.get(`user:${user.id}`);
    await kv.set(`user:${user.id}`, { ...currentProfile, avatar_url: publicUrl });

    return c.json({ avatar_url: publicUrl });
  } catch (error) {
    console.log(`Avatar upload error: ${error}`);
    return c.json({ error: 'Failed to upload avatar' }, 500);
  }
});

// ========== USERS ROUTES ==========

// Get all users
app.get('/make-server-0d6c4efa/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const usersList = await kv.get('users:list') || [];
    const users = [];

    for (const userId of usersList) {
      if (userId !== user.id) {
        const userProfile = await kv.get(`user:${userId}`);
        if (userProfile) {
          users.push(userProfile);
        }
      }
    }

    return c.json({ users });
  } catch (error) {
    console.log(`Get users error: ${error}`);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Get user by ID
app.get('/make-server-0d6c4efa/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.log(`Get user error: ${error}`);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Update user status
app.post('/make-server-0d6c4efa/users/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { status } = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    await kv.set(`user:${user.id}`, {
      ...currentProfile,
      status,
      last_seen: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Update status error: ${error}`);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// ========== MESSAGES ROUTES ==========

// Get or create chat
app.post('/make-server-0d6c4efa/chats/get-or-create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { otherUserId } = await c.req.json();
    
    // Create consistent chat ID
    const chatId = [user.id, otherUserId].sort().join('_');
    
    // Get or create chat
    let chat = await kv.get(`chat:${chatId}`);
    
    if (!chat) {
      chat = {
        id: chatId,
        participants: [user.id, otherUserId],
        created_at: new Date().toISOString(),
        last_message: null
      };
      await kv.set(`chat:${chatId}`, chat);
    }

    // Add to user's chat list
    const userChats = await kv.get(`chats:${user.id}`) || [];
    if (!userChats.includes(chatId)) {
      await kv.set(`chats:${user.id}`, [...userChats, chatId]);
    }

    const otherUserChats = await kv.get(`chats:${otherUserId}`) || [];
    if (!otherUserChats.includes(chatId)) {
      await kv.set(`chats:${otherUserId}`, [...otherUserChats, chatId]);
    }

    return c.json({ chat });
  } catch (error) {
    console.log(`Get or create chat error: ${error}`);
    return c.json({ error: 'Failed to get or create chat' }, 500);
  }
});

// Get user's chats
app.get('/make-server-0d6c4efa/chats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatIds = await kv.get(`chats:${user.id}`) || [];
    const chats = [];

    for (const chatId of chatIds) {
      const chat = await kv.get(`chat:${chatId}`);
      if (chat) {
        // Get other user's profile
        const otherUserId = chat.participants.find(p => p !== user.id);
        const otherUser = await kv.get(`user:${otherUserId}`);
        
        chats.push({
          ...chat,
          otherUser
        });
      }
    }

    // Sort by last message time
    chats.sort((a, b) => {
      const timeA = a.last_message?.timestamp || a.created_at;
      const timeB = b.last_message?.timestamp || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return c.json({ chats });
  } catch (error) {
    console.log(`Get chats error: ${error}`);
    return c.json({ error: 'Failed to get chats' }, 500);
  }
});

// Send message
app.post('/make-server-0d6c4efa/messages/send', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId, text } = await c.req.json();
    
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      chatId,
      senderId: user.id,
      text,
      timestamp: new Date().toISOString(),
      seen: false,
      reactions: {}
    };

    await kv.set(`message:${chatId}:${messageId}`, message);

    // Update chat's last message
    const chat = await kv.get(`chat:${chatId}`);
    if (chat) {
      await kv.set(`chat:${chatId}`, {
        ...chat,
        last_message: {
          text,
          timestamp: message.timestamp,
          senderId: user.id
        }
      });
    }

    // Add to messages list
    const messagesList = await kv.get(`messages:${chatId}`) || [];
    await kv.set(`messages:${chatId}`, [...messagesList, messageId]);

    return c.json({ message });
  } catch (error) {
    console.log(`Send message error: ${error}`);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get messages for chat
app.get('/make-server-0d6c4efa/messages/:chatId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const messageIds = await kv.get(`messages:${chatId}`) || [];
    const messages = [];

    for (const messageId of messageIds) {
      const message = await kv.get(`message:${chatId}:${messageId}`);
      if (message) {
        messages.push(message);
      }
    }

    return c.json({ messages });
  } catch (error) {
    console.log(`Get messages error: ${error}`);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Mark message as seen
app.post('/make-server-0d6c4efa/messages/seen', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId, messageId } = await c.req.json();
    const message = await kv.get(`message:${chatId}:${messageId}`);
    
    if (message) {
      await kv.set(`message:${chatId}:${messageId}`, { ...message, seen: true });
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Mark seen error: ${error}`);
    return c.json({ error: 'Failed to mark as seen' }, 500);
  }
});

// Delete message
app.post('/make-server-0d6c4efa/messages/delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId, messageId, deleteForEveryone } = await c.req.json();
    const message = await kv.get(`message:${chatId}:${messageId}`);
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    if (deleteForEveryone && message.senderId !== user.id) {
      return c.json({ error: 'Can only delete your own messages for everyone' }, 403);
    }

    if (deleteForEveryone) {
      await kv.set(`message:${chatId}:${messageId}`, { ...message, deleted: true, text: 'Ce message a été supprimé' });
    } else {
      const deletedFor = message.deletedFor || [];
      await kv.set(`message:${chatId}:${messageId}`, { ...message, deletedFor: [...deletedFor, user.id] });
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete message error: ${error}`);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// React to message
app.post('/make-server-0d6c4efa/messages/react', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId, messageId, emoji } = await c.req.json();
    const message = await kv.get(`message:${chatId}:${messageId}`);
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    const reactions = message.reactions || {};
    reactions[user.id] = emoji;

    await kv.set(`message:${chatId}:${messageId}`, { ...message, reactions });

    return c.json({ success: true });
  } catch (error) {
    console.log(`React to message error: ${error}`);
    return c.json({ error: 'Failed to react to message' }, 500);
  }
});

// ========== STORIES ROUTES ==========

// Create story
app.post('/make-server-0d6c4efa/stories/create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const type = formData.get('type') as string;

    let media_url = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const fileBuffer = await file.arrayBuffer();

      const { data, error: uploadError } = await supabase.storage
        .from('make-0d6c4efa-stories')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.log(`Story upload error: ${uploadError.message}`);
        return c.json({ error: uploadError.message }, 400);
      }

      const { data: { signedUrl } } = await supabase.storage
        .from('make-0d6c4efa-stories')
        .createSignedUrl(fileName, 86400); // 24h

      media_url = signedUrl;
    }

    const storyId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const story = {
      id: storyId,
      userId: user.id,
      media_url,
      type: type || 'text',
      text: text || '',
      timestamp: new Date().toISOString(),
      views: [],
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await kv.set(`story:${user.id}:${storyId}`, story);

    // Add to user's stories list
    const userStories = await kv.get(`stories:${user.id}`) || [];
    await kv.set(`stories:${user.id}`, [...userStories, storyId]);

    return c.json({ story });
  } catch (error) {
    console.log(`Create story error: ${error}`);
    return c.json({ error: 'Failed to create story' }, 500);
  }
});

// Get all active stories
app.get('/make-server-0d6c4efa/stories', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const usersList = await kv.get('users:list') || [];
    const storiesData = [];
    const now = new Date();

    for (const userId of usersList) {
      const storyIds = await kv.get(`stories:${userId}`) || [];
      const activeStories = [];

      for (const storyId of storyIds) {
        const story = await kv.get(`story:${userId}:${storyId}`);
        if (story && new Date(story.expires_at) > now) {
          activeStories.push(story);
        }
      }

      if (activeStories.length > 0) {
        const userProfile = await kv.get(`user:${userId}`);
        storiesData.push({
          user: userProfile,
          stories: activeStories.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        });
      }
    }

    return c.json({ stories: storiesData });
  } catch (error) {
    console.log(`Get stories error: ${error}`);
    return c.json({ error: 'Failed to get stories' }, 500);
  }
});

// View story
app.post('/make-server-0d6c4efa/stories/view', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId, storyId } = await c.req.json();
    const story = await kv.get(`story:${userId}:${storyId}`);
    
    if (!story) {
      return c.json({ error: 'Story not found' }, 404);
    }

    if (!story.views.includes(user.id)) {
      await kv.set(`story:${userId}:${storyId}`, {
        ...story,
        views: [...story.views, user.id]
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`View story error: ${error}`);
    return c.json({ error: 'Failed to view story' }, 500);
  }
});

Deno.serve(app.fetch);
