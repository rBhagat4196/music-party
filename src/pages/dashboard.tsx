import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
  getDocs,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/hooks/use-jam-session";
import { FileAudio, FileImage, Music, PlusCircle, Trash2 } from "lucide-react";

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
  category?: string;
};

type SongFormData = {
  title: string;
  artist: string;
  albumArtFile: File | null;
  audioFile: File | null;
  duration: string;
  category: string;
};

export default function Dashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SongFormData>({
    title: "",
    artist: "",
    albumArtFile: null,
    audioFile: null,
    duration: "0",
    category: "",
  });
  const [songs, setSongs] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<"library" | "add">("library");

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      if (name === "albumArtFile") {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(files[0]);
      }
      if (name === "audioFile" && audioRef.current) {
        const audioUrl = URL.createObjectURL(files[0]);
        audioRef.current.src = audioUrl;
        audioRef.current.onloadedmetadata = () => {
          setDuration(Math.floor(audioRef.current?.duration || 0));
          setFormData((prev) => ({
            ...prev,
            duration: Math.floor(audioRef.current?.duration || 0).toString(),
          }));
        };
      }
    }
  };

  const uploadToCloudinary = async (file: File, resourceType: "image" | "video" | "auto") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", unsignedUploadPreset);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return { url: data.secure_url, publicId: data.public_id };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.title || !formData.artist || !formData.audioFile) throw new Error("Missing required fields");

      let albumArtUrl = "https://via.placeholder.com/300";
      let albumArtPublicId = "";

      if (formData.albumArtFile) {
        const { url, publicId } = await uploadToCloudinary(formData.albumArtFile, "image");
        albumArtUrl = url;
        albumArtPublicId = publicId;
      }

      const { url: songUrl, publicId: songPublicId } = await uploadToCloudinary(formData.audioFile!, "video");
      const randomId = `song-${Math.floor(Math.random() * 1000)}`;

      await addDoc(collection(db, "songs"), {
        id: randomId,
        title: formData.title,
        artist: formData.artist,
        albumArt: albumArtUrl,
        duration: parseInt(formData.duration),
        songURL: songUrl,
        publicId: songPublicId,
        addedBy: "admin",
        category: formData.category,
      });

      toast({ title: "Success", description: "Song added successfully" });
      setFormData({ title: "", artist: "", albumArtFile: null, audioFile: null, duration: "0", category: "" });
      setPreviewUrl(null);
      setDuration(0);
      setActiveTab("library");
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload song", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSong = async (song: Song) => {
    if (!window.confirm(`Delete '${song.title}' by ${song.artist}?`)) return;
    try {
      const q = query(collection(db, "songs"), where("id", "==", song.id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => await deleteDoc(doc.ref));
      toast({ title: "Deleted", description: `Song '${song.title}' removed.` });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Could not delete song", 
        variant: "destructive" 
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Music className="mr-3 text-indigo-600" size={28} />
            Music Dashboard
          </h1>
          <p className="text-white">Manage your music library and upload new tracks</p>
        </header>

        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 font-medium ${activeTab === "library" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-white hover:text-white"}`}
          >
            Music Library
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 font-medium ${activeTab === "add" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-white hover:text-white"}`}
          >
            <PlusCircle className="inline mr-2" size={18} />
            Add New Song
          </button>
        </div>

        {activeTab === "add" ? (
          <div className="bg-spotify-dark-elevated rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Upload New Song</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Title*</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Song title"
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Artist*</label>
                    <input
                      type="text"
                      name="artist"
                      value={formData.artist}
                      onChange={handleInputChange}
                      placeholder="Artist name"
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      <FileImage className="inline mr-2" size={16} />
                      Album Art (Optional)
                    </label>
                    <input
                      type="file"
                      name="albumArtFile"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      <FileAudio className="inline mr-2" size={16} />
                      Audio File*
                    </label>
                    <input
                      type="file"
                      name="audioFile"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      required
                    />
                    {duration > 0 && (
                      <p className="mt-2 text-sm text-white">Duration: {formatDuration(duration)}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Category (Optional)</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Rock, Pop, Classical"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <PlusCircle className="mr-2" size={18} />
                        Add Song
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-spotify-dark-highlight rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-white">Your Music Library</h2>
                <p className="text-sm text-white">{songs.length} songs available</p>
              </div>
              
              {songs.length === 0 ? (
                <div className="p-8 text-center">
                  <Music className="mx-auto text-white" size={48} />
                  <h3 className="mt-2 text-lg font-medium text-white">No songs yet</h3>
                  <p className="mt-1 text-white">Upload your first song to get started</p>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusCircle className="mr-2" size={16} />
                    Add New Song
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {songs.map((song) => (
                    <div key={song.id} className="bg-spotify-dark-elevated border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative">
                        <img 
                          src={song.albumArt} 
                          alt={song.title} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(song.duration)}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white line-clamp-1">{song.title}</h3>
                            <p className="text-sm text-white">{song.artist}</p>
                          </div>
                          <button
                            onClick={() => deleteSong(song)}
                            className="text-white hover:text-red-500 transition-colors"
                            title="Delete song"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        {song.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                            {song.category}
                          </span>
                        )}
                        <div className="mt-3">
                          <audio 
                            controls 
                            src={song.songURL} 
                            className="w-full h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}