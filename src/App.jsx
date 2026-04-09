import React, { useState, useEffect } from 'react';

// --- Icons ---
const GridIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const HeartIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const MessageCircleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>;
const XIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const SparklesIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const PlusSquareIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
const ChevronLeftIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>;
const UserPlusIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;

// --- Constants & Config ---
const STORAGE_KEY = 'ai_ig_avatar_platform';
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

// --- Pre-loaded Default Profiles ---
const DEFAULT_AVATARS = {
  "aura_nova": {
    profile: {
      id: "aura_nova",
      name: "Aura Nova",
      handle: "aura.lens",
      bio: "Digital explorer 🌍 | AI generated life 🤖\nFinding beauty in the latent space ✨\n📍 Neo-Tokyo",
      visualTraits: "22yo female, silver hair with soft purple highlights, striking green eyes, highly attractive, wearing futuristic minimalist streetwear",
      profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      followers: "12.4K",
      following: "142",
    },
    feed: []
  },
  "zane_pixel": {
    profile: {
      id: "zane_pixel",
      name: "Zane Pixel",
      handle: "zane.arcade",
      bio: "Retro aesthetics & lo-fi beats 🕹️🎧\nCode by day, neon by night 🌃",
      visualTraits: "24yo male, messy dark hair, wearing vintage round glasses and a vibrant synthwave retro jacket, warm neon lighting",
      profilePicUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
      followers: "8.1K",
      following: "210",
    },
    feed: []
  }
};

// --- Helper Functions ---
const exponentialBackoff = async (apiCall, maxRetries = 4) => {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Retrying... Attempt ${i+1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const saveToStorage = (state) => {
  let currentState = JSON.parse(JSON.stringify(state)); // Deep copy to safely mutate
  let saved = false;
  while (!saved) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      saved = true;
    } catch (e) {
      // Find the avatar with the longest feed and trim it to avoid quota errors
      let maxLen = 0;
      let maxId = null;
      Object.keys(currentState.avatars).forEach(id => {
        if (currentState.avatars[id].feed.length > maxLen) {
          maxLen = currentState.avatars[id].feed.length;
          maxId = id;
        }
      });
      
      if (maxLen > 1 && maxId) {
        console.warn("Storage quota exceeded, trimming oldest post from heaviest feed...");
        currentState.avatars[maxId].feed.pop(); // Remove oldest
      } else {
        console.error("Storage full and cannot be trimmed further.");
        break;
      }
    }
  }
};

export default function App() {
  const [appState, setAppState] = useState({
    avatars: DEFAULT_AVATARS,
  });
  
  // Navigation State
  const [currentView, setCurrentView] = useState('home'); // 'home', 'profile', 'create'
  const [currentAvatarId, setCurrentAvatarId] = useState(null);
  
  // Action State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState(null);
  const [createPrompt, setCreatePrompt] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.avatars && Object.keys(parsed.avatars).length > 0) {
          setAppState(parsed);
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, []);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    saveToStorage(appState);
  }, [appState]);

  // --- API Handlers ---
  const generateTextJSON = async (prompt, systemInstruction, schema) => {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };
    const apiCall = async () => {
      const res = await fetch(TEXT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Text API Error: ${res.status}`);
      return res.json();
    };
    const result = await exponentialBackoff(apiCall);
    return JSON.parse(result.candidates[0].content.parts[0].text);
  };

  const generateImageMedia = async (prompt) => {
    const payload = { 
      instances: { prompt: prompt },
      parameters: { sampleCount: 1 } 
    };
    const apiCall = async () => {
      const res = await fetch(IMAGE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Image API Error: ${res.status}`);
      return res.json();
    };
    const result = await exponentialBackoff(apiCall);
    return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
  };

  // --- App Actions ---
  
  const handleCreateNewAvatar = async () => {
    if (!createPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setLoadingText('Dreaming up persona...');

    try {
      const schema = {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          handle: { type: "STRING" },
          bio: { type: "STRING" },
          visualTraits: { type: "STRING", description: "Detailed physical description for image gen prompt" }
        },
        required: ["name", "handle", "bio", "visualTraits"]
      };
      
      const profileData = await generateTextJSON(`Create a social media persona based on this concept: ${createPrompt}`, "You create detailed, realistic personas for virtual influencers.", schema);

      setLoadingText('Capturing profile picture...');
      const pfpPrompt = `Close up portrait profile picture of ${profileData.visualTraits}, facing camera, cinematic modern lighting, high quality 85mm photography.`;
      const pfpUrl = await generateImageMedia(pfpPrompt);

      const newId = crypto.randomUUID();
      const newAvatar = {
        profile: {
          id: newId,
          ...profileData,
          profilePicUrl: pfpUrl,
          followers: (Math.floor(Math.random() * 50) + 1) + "K",
          following: Math.floor(Math.random() * 300) + 50,
        },
        feed: []
      };

      setAppState(prev => ({
        ...prev,
        avatars: {
          [newId]: newAvatar,
          ...prev.avatars // Add new to top
        }
      }));
      
      setCreatePrompt('');
      setCurrentAvatarId(newId);
      setCurrentView('profile');

    } catch (err) {
      console.error(err);
      setError("Failed to create avatar. Check network or API limit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLifeEvent = async () => {
    if (!currentAvatarId) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingText('Thinking of a caption...');

    try {
      const avatarData = appState.avatars[currentAvatarId];
      const { profile, feed } = avatarData;
      const recentHistory = feed.slice(0, 3).map(p => p.caption).join(' | ');
      
      const schema = {
        type: "OBJECT",
        properties: {
          caption: { type: "STRING" },
          activityImagePrompt: { type: "STRING" }
        },
        required: ["caption", "activityImagePrompt"]
      };

      const prompt = `You are ${profile.name} (@${profile.handle}). Bio: "${profile.bio}". 
      Write a new Instagram post caption about something aesthetic you are doing right now. 
      Recent posts: [${recentHistory}]. Keep it trendy. Include hashtags and emojis.`;

      const postConcept = await generateTextJSON(prompt, "You are a virtual influencer roleplaying your daily life.", schema);

      setLoadingText('Generating photo...');
      
      // Inject persistent visual traits
      const imagePrompt = `Instagram photo, highly aesthetic. A photo of ${profile.visualTraits}. They are ${postConcept.activityImagePrompt}. Cinematic lighting, shot on 35mm lens, high resolution.`;
      const photoUrl = await generateImageMedia(imagePrompt);

      const newPost = {
        id: crypto.randomUUID(),
        caption: postConcept.caption,
        imageUrl: photoUrl,
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 800) + 120
      };

      setAppState(prev => ({
        ...prev,
        avatars: {
          ...prev.avatars,
          [currentAvatarId]: {
            ...avatarData,
            feed: [newPost, ...avatarData.feed]
          }
        }
      }));

    } catch (err) {
      console.error(err);
      setError("Failed to generate post. Check API key or network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPlatform = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAppState({ avatars: DEFAULT_AVATARS });
    setCurrentView('home');
    setCurrentAvatarId(null);
  };

  // --- Views ---

  const renderHome = () => (
    <div className="flex flex-col h-full bg-zinc-950">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md px-6 py-4 border-b border-zinc-900 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-tight">
          AILife Platform
        </h1>
        <button onClick={handleResetPlatform} className="text-xs font-semibold text-zinc-500 hover:text-red-400 transition">Factory Reset</button>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-lg font-bold text-white">Your Avatars</h2>
        </div>

        <div className="grid gap-4">
          {Object.values(appState.avatars).map((avatar) => (
            <div 
              key={avatar.profile.id}
              onClick={() => { setCurrentAvatarId(avatar.profile.id); setCurrentView('profile'); }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800 transition shadow-lg group"
            >
              <img src={avatar.profile.profilePicUrl} alt={avatar.profile.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate text-lg">{avatar.profile.name}</h3>
                <p className="text-sm text-zinc-400 truncate">@{avatar.profile.handle}</p>
                <div className="flex gap-3 mt-1 text-xs text-zinc-500 font-medium">
                  <span>{avatar.profile.followers} followers</span>
                  <span>•</span>
                  <span>{avatar.feed.length} posts</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition">
                <ChevronLeftIcon className="w-5 h-5 text-zinc-400 rotate-180" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="p-4 border-t border-zinc-900 bg-black pb-8">
        <button 
          onClick={() => setCurrentView('create')}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 px-4 rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          Birth New Avatar
        </button>
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="flex flex-col h-full bg-zinc-950">
       <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md px-4 py-3 border-b border-zinc-900 flex items-center gap-3">
        <button onClick={() => setCurrentView('home')} className="text-white hover:text-zinc-400 p-1">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white">Create Persona</h1>
      </header>

      <main className="flex-1 p-6 flex flex-col justify-center items-center">
         <div className="p-4 bg-zinc-900 rounded-full text-fuchsia-400 mb-6 shadow-lg shadow-fuchsia-900/20">
            <SparklesIcon className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-center mb-2 text-white">Design an Identity</h2>
          <p className="text-center text-zinc-400 mb-8 text-sm max-w-xs">Provide a concept, and AI will hallucinate their life, looks, and social media presence.</p>
          
          <textarea
            value={createPrompt}
            onChange={(e) => setCreatePrompt(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., A minimalist barista in Tokyo who loves analog photography and jazz..."
            className="w-full bg-black border border-zinc-700 rounded-2xl p-5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none resize-none mb-6 text-base min-h-[140px] shadow-inner"
          />
          
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          
          <button
            onClick={handleCreateNewAvatar}
            disabled={isLoading || !createPrompt.trim()}
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 px-4 rounded-2xl shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 animate-pulse text-sm">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                {loadingText}
              </span>
            ) : (
              "Generate Avatar"
            )}
          </button>
      </main>
    </div>
  );

  const renderProfile = () => {
    if (!currentAvatarId || !appState.avatars[currentAvatarId]) return null;
    const { profile, feed } = appState.avatars[currentAvatarId];

    return (
      <div className="flex flex-col h-full relative">
        {/* --- IG Top Header --- */}
        <header className="sticky top-0 z-30 bg-black flex justify-between items-center px-4 py-3 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('home')} className="text-white hover:text-zinc-400">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold tracking-tight">{profile.handle}</h1>
              <svg aria-label="Verified" className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-8.1 8.1z"></path></svg>
            </div>
          </div>
          <button onClick={handleGenerateLifeEvent} disabled={isLoading} className="text-white hover:text-zinc-400 transition">
            <PlusSquareIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-10">
          {/* --- Profile Info Section --- */}
          <section className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              {/* PFP */}
              <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 shrink-0">
                <img src={profile.profilePicUrl} alt={profile.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
              </div>
              
              {/* Stats */}
              <div className="flex flex-1 justify-around text-center ml-4">
                <div>
                  <p className="font-bold text-lg">{feed.length}</p>
                  <p className="text-xs text-zinc-300">posts</p>
                </div>
                <div>
                  <p className="font-bold text-lg">{profile.followers}</p>
                  <p className="text-xs text-zinc-300">followers</p>
                </div>
                <div>
                  <p className="font-bold text-lg">{profile.following}</p>
                  <p className="text-xs text-zinc-300">following</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <h2 className="font-semibold text-sm">{profile.name}</h2>
              <p className="text-sm whitespace-pre-wrap leading-tight text-zinc-200 mt-1">{profile.bio}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={handleGenerateLifeEvent}
                disabled={isLoading}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-1.5 px-4 rounded-lg text-sm flex justify-center items-center gap-2 transition"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {loadingText}
                  </span>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate New Post
                  </>
                )}
              </button>
            </div>
            
            {error && <div className="mt-3 text-xs text-red-400 text-center">{error}</div>}
          </section>

          {/* --- Grid Tabs --- */}
          <div className="flex border-t border-zinc-800 mt-2">
            <div className="flex-1 flex justify-center items-center py-3 border-t-2 border-white">
              <GridIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 flex justify-center items-center py-3 text-zinc-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <div className="flex-1 flex justify-center items-center py-3 text-zinc-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
          </div>

          {/* --- Image Grid --- */}
          <div className="grid grid-cols-3 gap-0.5">
            {feed.length === 0 && !isLoading && (
              <div className="col-span-3 py-20 text-center flex flex-col items-center justify-center text-zinc-500">
                <div className="w-16 h-16 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">
                  <PlusSquareIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Capture the Moment</h3>
                <p className="text-sm">Click 'Generate New Post' to start.</p>
              </div>
            )}

            {isLoading && (
              <div className="aspect-square bg-zinc-900 animate-pulse flex items-center justify-center border border-zinc-800">
                <SparklesIcon className="w-6 h-6 text-zinc-600 animate-spin-slow" />
              </div>
            )}

            {feed.map((post) => (
              <div 
                key={post.id} 
                className="aspect-square bg-zinc-800 cursor-pointer group relative"
                onClick={() => setSelectedPost(post)}
              >
                <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 font-bold"><HeartIcon className="w-5 h-5 fill-white"/> {post.likes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Post Detail Modal (Full Screen) --- */}
        {selectedPost && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col animate-slide-up h-full">
            <header className="flex justify-between items-center px-4 py-3 border-b border-zinc-900 bg-black">
              <button onClick={() => setSelectedPost(null)} className="text-white p-1">
                <XIcon className="w-6 h-6" />
              </button>
              <h2 className="font-bold text-sm uppercase tracking-wide">Posts</h2>
              <div className="w-8"></div>
            </header>
            
            <div className="flex-1 overflow-y-auto pb-10">
              <div className="flex items-center gap-3 p-3">
                 <img src={profile.profilePicUrl} alt="pfp" className="w-8 h-8 rounded-full object-cover" />
                 <h3 className="font-semibold text-sm">{profile.handle}</h3>
              </div>
              
              <img src={selectedPost.imageUrl} alt="Full post" className="w-full aspect-square object-cover" />
              
              <div className="p-3">
                <div className="flex gap-4 mb-2">
                  <HeartIcon className="w-6 h-6 text-white hover:text-red-500 cursor-pointer transition" />
                  <MessageCircleIcon className="w-6 h-6 text-white cursor-pointer hover:text-zinc-400" />
                  <svg className="w-6 h-6 cursor-pointer hover:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </div>
                <p className="font-bold text-sm mb-2">{selectedPost.likes} likes</p>
                <p className="text-sm">
                  <span className="font-semibold mr-2">{profile.handle}</span>
                  <span className="whitespace-pre-wrap">{selectedPost.caption}</span>
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-2">
                  {new Date(selectedPost.timestamp).toLocaleDateString([], {month: 'long', day: 'numeric'})}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans sm:bg-zinc-950 flex justify-center">
      {/* Mobile-sized container to mimic a phone screen */}
      <div className="w-full sm:max-w-md bg-black sm:border-x sm:border-zinc-800 h-screen overflow-hidden relative">
        {currentView === 'home' && renderHome()}
        {currentView === 'create' && renderCreate()}
        {currentView === 'profile' && renderProfile()}
      </div>
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out forwards; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
}
