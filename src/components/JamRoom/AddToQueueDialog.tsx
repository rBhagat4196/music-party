import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Song } from '@/hooks/use-jam-session';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/hooks/use-jam-session';

interface AddToQueueDialogProps {
  onAddSong: (song: Song) => void;
}

const AddToQueueDialog: React.FC<AddToQueueDialogProps> = ({ onAddSong }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all songs when component mounts
  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        const songs: Song[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          songs.push({
            id: data.id || doc.id,
            title: data.title,
            artist: data.artist,
            albumArt: data.albumArt || 'https://via.placeholder.com/150',
            duration: data.duration,
            songURL: data.songURL,
            addedBy: data.addedBy || '',
            // publicId: data.publicId
          });
        });
        setAllSongs(songs);
        setFilteredSongs(songs); // Initially show all songs
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSongs();
    }
  }, [isOpen]);

  // Filter songs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(allSongs);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const results = allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery)
    );
    setFilteredSongs(results);
  }, [searchQuery, allSongs]);

  const handleAddSong = (song: Song) => {
    onAddSong(song);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add to Queue</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Queue</DialogTitle>
          <DialogDescription>Search for songs to add to the jam session.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Search songs or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mt-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-gray-500">Loading songs...</div>
          ) : filteredSongs.length > 0 ? (
            filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => handleAddSong(song)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
              >
                <img 
                  src={song.albumArt} 
                  alt="cover" 
                  className="w-12 h-12 rounded" 
                />
                <div>
                  <div className="font-medium">{song.title}</div>
                  <div className="text-sm text-gray-500">{song.artist}</div>
                  <div className="text-xs text-gray-400">
                    {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-6">
              {searchQuery ? `No songs found for "${searchQuery}"` : 'No songs available.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToQueueDialog;