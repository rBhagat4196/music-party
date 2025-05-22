
import React from 'react';
import { Song } from '@/hooks/use-jam-session';
import { List, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueueListProps {
  queue: Song[];
  onAddToQueue: () => void;
  canAddToQueue: boolean;
}

const QueueList: React.FC<QueueListProps> = ({ 
  queue, 
  onAddToQueue, 
  canAddToQueue 
}) => {


  // console.log(queue);
  return (
    <div className="bg-spotify-dark-elevated rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <List className="h-5 w-5 mr-2 text-spotify-green" />
          <h3 className="font-semibold text-lg">Queue</h3>
        </div>
        <Button
          onClick={onAddToQueue}
          disabled={!canAddToQueue}
          variant="ghost"
          size="sm"
          className={`text-spotify-green hover:bg-spotify-green/10 ${!canAddToQueue ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ListPlus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-8 text-spotify-subtext">
          <p>Queue is empty</p>
          <p className="text-xs mt-1">Add songs to keep the session going</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
          {queue.map((song, index) => (
            <div 
              key={`${song.id}-${index}`}
              className="flex items-center p-2 hover:bg-spotify-dark-highlight rounded-md transition-colors group"
            >
              <div className="w-8 h-8 flex-shrink-0">
                <img 
                  src={song.albumArt} 
                  alt={`${song.title} cover`} 
                  className="w-full h-full object-cover rounded" 
                />
              </div>
              <div className="ml-3 flex-grow min-w-0">
                <div className="font-medium text-sm truncate">{song.title}</div>
                <div className="text-xs text-spotify-subtext truncate">{song.artist}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 text-xs text-spotify-subtext">
                {index === 0 ? 'Up next' : `#${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueList;
