import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, SkipBack, SkipForward, Volume2, Home, Music, Users, ListMusic } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/hooks/use-jam-session';

type Song = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  songURL: string;
  addedBy: string;
  publicId?: string;
  category?: string;
};

const Index = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'spotify' | 'jamming'>('spotify');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch songs from Firestore
  useEffect(() => {
    const q = query(collection(db, "songs"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const songsData: Song[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        songsData.push({
          id: data.id || doc.id,
          title: data.title,
          artist: data.artist,
          albumArt: data.albumArt,
          duration: data.duration,
          songURL: data.songURL,
          addedBy: data.addedBy,
          publicId: data.publicId,
          category: data.category,
        });
      });
      setSongs(songsData);
    });

    return () => unsubscribe();
  }, []);

  // Filter songs based on search and category
  useEffect(() => {
    let results = songs;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(song => 
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery))
    }
    
    if (activeCategory) {
      results = results.filter(song => song.category === activeCategory);
    }
    
    setFilteredSongs(results);
  }, [searchQuery, activeCategory, songs]);

  // Handle play/pause
  const handlePlayPause = (song: Song) => {
    if (currentSong?.id === song.id) {
      // Toggle play/pause for current song
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // Play new song
      setCurrentSong(song);
      setIsPlaying(true);
      // Playback will be handled by the useEffect below
    }
  };

  // Handle audio playback when currentSong changes
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    // Reset audio and play new song
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = currentSong.songURL;
    audioRef.current.play().catch(error => {
      console.error("Audio playback failed:", error);
      setIsPlaying(false);
    });

    // Update volume
    audioRef.current.volume = volume / 100;
  }, [currentSong]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle play next song
  const playNextSong = () => {
    if (!currentSong) return;
    
    const currentIndex = filteredSongs.findIndex(song => song.id === currentSong.id);
    if (currentIndex < filteredSongs.length - 1) {
      setCurrentSong(filteredSongs[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  // Handle play previous song
  const playPrevSong = () => {
    if (!currentSong) return;
    
    const currentIndex = filteredSongs.findIndex(song => song.id === currentSong.id);
    if (currentIndex > 0) {
      setCurrentSong(filteredSongs[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  // Handle song ended
  const handleSongEnded = () => {
    playNextSong();
  };

  const categories = [
    { name: 'Bollywood', value: 'bollywood' },
    { name: 'Punjabi', value: 'punjabi' },
    { name: 'Classical', value: 'classical' },
    { name: 'Party Songs', value: 'party' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-spotify-dark to-black">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleSongEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Sidebar */}
      <div className="w-64 bg-spotify-dark-elevated p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-spotify-green">Music App</h1>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  setActiveView('spotify');
                  setActiveCategory(null);
                }}
                className={`flex items-center w-full p-3 rounded-md ${activeView === 'spotify' && !activeCategory ? 'bg-spotify-dark-highlight' : 'hover:bg-spotify-dark-highlight'}`}
              >
                <Home className="mr-3" size={20} />
                Spotify
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('jamming')}
                className={`flex items-center w-full p-3 rounded-md ${activeView === 'jamming' ? 'bg-spotify-dark-highlight' : 'hover:bg-spotify-dark-highlight'}`}
              >
                <Users className="mr-3" size={20} />
                Jamming
              </button>
            </li>
            <li className="mt-6">
              <div className="flex items-center p-3 text-spotify-subtext">
                <ListMusic className="mr-3" size={20} />
                Categories
              </div>
              <ul className="ml-8 mt-1 space-y-1">
                {categories.map(category => (
                  <li key={category.value}>
                    <button
                      onClick={() => {
                        setActiveView('spotify');
                        setActiveCategory(category.value);
                      }}
                      className={`flex items-center w-full p-2 rounded-md text-sm ${activeCategory === category.value ? 'bg-spotify-dark-highlight text-white' : 'text-spotify-subtext hover:bg-spotify-dark-highlight'}`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeView === 'spotify' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">
                {activeCategory ? 
                  `${categories.find(c => c.value === activeCategory)?.name} Songs` : 
                  'All Songs'}
              </h2>
              <div className="w-1/3">
                <Input
                  placeholder="Search songs or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-spotify-dark-highlight border-none text-white"
                />
              </div>
            </div>

            {/* Songs List */}
            <div className="bg-spotify-dark-elevated rounded-lg p-4">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <div 
                    key={song.id} 
                    className={`flex items-center p-3 rounded-md hover:bg-spotify-dark-highlight ${currentSong?.id === song.id ? 'bg-spotify-dark-highlight' : ''}`}
                  >
                    <img 
                      src={song.albumArt || 'https://via.placeholder.com/150'} 
                      alt={song.title} 
                      className="w-16 h-16 rounded mr-4" 
                    />
                    <div className="flex-grow">
                      <h3 className="font-medium">{song.title}</h3>
                      <p className="text-spotify-subtext text-sm">{song.artist}</p>
                      {song.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-spotify-purple/20 text-spotify-purple">
                          {song.category}
                        </span>
                      )}
                    </div>
                    <div className="text-spotify-subtext mr-4">
                      {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                    </div>
                    <button 
                      onClick={() => handlePlayPause(song)}
                      className="p-2 rounded-full bg-spotify-green text-black hover:bg-spotify-light-green"
                    >
                      {currentSong?.id === song.id && isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-spotify-subtext">
                  {searchQuery ? 'No songs found matching your search' : 'No songs available'}
                </div>
              )}
            </div>

            {/* Player Controls */}
            {currentSong && (
              <div className="fixed bottom-0 left-64 right-0 bg-spotify-dark-highlight p-4 border-t border-spotify-dark-elevated">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={currentSong.albumArt || 'https://via.placeholder.com/150'} 
                      alt="Album cover" 
                      className="w-16 h-16 rounded mr-4" 
                    />
                    <div>
                      <h4 className="font-medium">{currentSong.title}</h4>
                      <p className="text-spotify-subtext text-sm">{currentSong.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={playPrevSong} className="text-spotify-subtext hover:text-white">
                      <SkipBack size={24} />
                    </button>
                    <button 
                      onClick={() => handlePlayPause(currentSong)}
                      className="p-2 rounded-full bg-white text-black hover:bg-gray-200"
                    >
                      {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
                    </button>
                    <button onClick={playNextSong} className="text-spotify-subtext hover:text-white">
                      <SkipForward size={24} />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <Volume2 size={20} className="text-spotify-subtext mr-2" />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-24 accent-spotify-green" 
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-spotify-green to-spotify-purple">
              Spotify Jam Session
            </h1>
            
            <p className="text-xl md:text-2xl text-spotify-subtext mb-8">
              Create and join interactive music listening rooms with voice chat and real-time synchronization.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/jam-session')}
                className="bg-spotify-green hover:bg-spotify-light-green text-black text-lg font-medium py-6 px-8 rounded-full transform hover:scale-105 transition-all duration-300"
              >
                Start Jamming
              </Button>
              
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-spotify-dark-highlight hover:bg-spotify-dark-elevated text-white text-lg font-medium py-6 px-8 rounded-full transform hover:scale-105 transition-all duration-300 border border-spotify-dark-highlight"
              >
                Manage Music
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
                <div className="h-12 w-12 bg-spotify-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="h-6 w-6 text-spotify-purple" />
                </div>
                <h3 className="text-xl font-bold mb-2">Synchronized Playback</h3>
                <p className="text-spotify-subtext">Listen to the same songs at the same time, with playback synced across all devices.</p>
              </div>
              
              <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
                <div className="h-12 w-12 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-spotify-green" />
                </div>
                <h3 className="text-xl font-bold mb-2">Voice Chat</h3>
                <p className="text-spotify-subtext">Talk with your friends in real-time while enjoying music together.</p>
              </div>
              
              <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
                <div className="h-12 w-12 bg-spotify-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ListMusic className="h-6 w-6 text-spotify-purple" />
                </div>
                <h3 className="text-xl font-bold mb-2">Collaborative Queue</h3>
                <p className="text-spotify-subtext">Add songs to the shared queue and take turns being the DJ.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;