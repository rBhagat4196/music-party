import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/hooks/use-jam-session";

const cloudName = import.meta.env.VITE_CLOUDNAME;
const unsignedUploadPreset = import.meta.env.VITE_PRESET;

type Song = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  songURL: string;
  addedBy: string;
  publicId?: string;
};

type SongFormData = {
  title: string;
  artist: string;
  albumArtFile: File | null;
  audioFile: File | null;
  duration: string;
};

export default function Dashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    artist: '',
    albumArtFile: null,
    audioFile: null,
    duration: '0'
  });
  const [songs, setSongs] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  console.log(songs)

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video' | 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', unsignedUploadPreset);
    formData.append('cloud_name', cloudName);
    formData.append('resource_type', resourceType);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload file to Cloudinary');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  };

  // Delete file from Cloudinary
  const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video') => {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature: signature,
          timestamp: timestamp,
          api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file from Cloudinary');
    }

    return response.json();
  };

  // Generate signature for Cloudinary delete (should be done server-side in production)
  const generateSignature = async (publicId: string, timestamp: number) => {
    // Note: In production, this should be done server-side
    // This is just for demonstration purposes
    return 'generated_signature';
  };

  // Fetch songs from Firestore
  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('title', 'asc'));
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
          publicId: data.publicId
        });
      });
      setSongs(songsData);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));

      // Create preview for album art
      if (name === 'albumArtFile') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(files[0]);
      }

      // Calculate duration for audio file
      if (name === 'audioFile' && audioRef.current) {
        const audioUrl = URL.createObjectURL(files[0]);
        audioRef.current.src = audioUrl;
        
        audioRef.current.onloadedmetadata = () => {
          setDuration(Math.floor(audioRef.current?.duration || 0));
          setFormData(prev => ({ ...prev, duration: Math.floor(audioRef.current?.duration || 0).toString() }));
        };
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.title || !formData.artist || !formData.audioFile) {
        throw new Error('Please fill in all required fields');
      }

      // Upload files to Cloudinary
      let albumArtUrl = 'https://via.placeholder.com/150';
      let albumArtPublicId = '';
      
      if (formData.albumArtFile) {
        const { url, publicId } = await uploadToCloudinary(formData.albumArtFile, 'image');
        albumArtUrl = url;
        albumArtPublicId = publicId;
      }

      const { url: songUrl, publicId: songPublicId } = await uploadToCloudinary(formData.audioFile!, 'video');

      // Generate random ID in format 'song-X'
      const randomId = `song-${Math.floor(Math.random() * 1000)}`;

      // Add song to Firestore with the desired structure
      await addDoc(collection(db, 'songs'), {
        id: randomId,
        title: formData.title,
        artist: formData.artist,
        albumArt: albumArtUrl,
        duration: parseInt(formData.duration),
        songURL: songUrl,
        publicId: songPublicId,
        addedBy: 'admin',
      });

      toast({
        title: 'Success!',
        description: 'Song added successfully',
      });

      // Reset form
      setFormData({
        title: '',
        artist: '',
        albumArtFile: null,
        audioFile: null,
        duration: '0'
      });
      setPreviewUrl(null);
      setDuration(0);
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add song',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSong = async (song: Song) => {
    if (!window.confirm(`Are you sure you want to delete "${song.title}" by ${song.artist}?`)) return;

    try {
      // Find the document with matching id field
      const q = query(collection(db, 'songs'), where('id', '==', song.id));
      const querySnapshot = await getDocs(q);
      
      // Delete all matching documents (should be just one)
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Delete audio file from Cloudinary
      if (song.publicId) {
        await deleteFromCloudinary(song.publicId, 'video');
      }

      toast({
        title: 'Success',
        description: 'Song deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete song',
        variant: 'destructive',
      });
    }
  };

  const seedSampleSongs = async () => {
    const songsArray = [
      {
        id: 'song-4',
        title: 'Don\'t Start Now',
        artist: 'Dua Lipa',
        albumArt: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
        duration: 183,
        addedBy: 'admin',
        songURL: 'https://example.com/song4.mp3'
      },
      {
        id: 'song-5',
        title: 'Levitating',
        artist: 'Dua Lipa ft. DaBaby',
        albumArt: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
        duration: 203,
        addedBy: 'admin',
        songURL: 'https://example.com/song5.mp3'
      },
    ];

    try {
      for (const song of songsArray) {
        await addDoc(collection(db, 'songs'), song);
      }
      toast({
        title: 'Success!',
        description: 'Sample songs added successfully',
      });
    } catch (error) {
      console.error('Error seeding songs:', error);
      toast({
        title: 'Error',
        description: 'Failed to add sample songs',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Music Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Song Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Song</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Artist */}
                <div>
                  <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
                    Artist *
                  </label>
                  <input
                    type="text"
                    id="artist"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Album Art */}
                <div>
                  <label htmlFor="albumArtFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Album Art
                  </label>
                  <input
                    type="file"
                    id="albumArtFile"
                    name="albumArtFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img src={previewUrl} alt="Album preview" className="h-32 w-32 object-cover rounded" />
                    </div>
                  )}
                </div>

                {/* Audio File */}
                <div>
                  <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Audio File *
                  </label>
                  <input
                    type="file"
                    id="audioFile"
                    name="audioFile"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <audio ref={audioRef} className="hidden" />
                  {duration > 0 && (
                    <p className="mt-1 text-sm text-gray-500">Duration: {duration} seconds</p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Uploading...' : 'Add Song'}
                  </button>
                </div>
              </div>
            </form>

            <button
              onClick={seedSampleSongs}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Seed Sample Songs
            </button>
          </div>
        </div>

        {/* Song List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Song Library</h2>
            
            {songs.length === 0 ? (
              <p className="text-gray-500">No songs added yet. Add your first song above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cover</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {songs.map((song) => (
                      <tr key={song.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={song.albumArt} alt={song.title} className="h-10 w-10 rounded object-cover" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{song.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{song.artist}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => deleteSong(song)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}