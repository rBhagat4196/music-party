
import React from 'react';
import { User,Room } from '@/hooks/use-jam-session';
import { Users, Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
interface ParticipantsListProps {
  participants: User[];
  hostId: string;
  isHost: boolean;
  onTogglePermission: (userId: string) => void;
  room : Room
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ 
  participants, 
  hostId,
  isHost,
  onTogglePermission,
  room
}) => {
  // console.log(participants)
  return (
    <div className="bg-spotify-dark-elevated rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 mr-2 text-spotify-purple" />
        <h3 className="font-semibold text-lg">People in this jam</h3>
      </div>

      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
       {participants && Object.values(participants).map((user) => (
        
          <div 
            key={user.id}
            className="flex items-center justify-between p-2 hover:bg-spotify-dark-highlight rounded-md transition-colors"
          >
            <div className="flex items-center flex-grow min-w-0">
              <div className="relative">
                <img 
                  src={user.avatarUrl || 'https://i.pravatar.cc/150'} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full"
                />
                {user.isMicOn && (
                  <div className="absolute -bottom-1 -right-1 bg-spotify-green rounded-full p-1">
                    <Mic className="h-3 w-3 text-black" />
                    {/* <VoiceChat/> */}
                  </div>
                )}
              </div>
              <div className="ml-3 truncate">
                <div className="font-medium flex items-center">
                  <span className="truncate">{user.name}</span>
                  {user.id === hostId && (
                    <Badge className="ml-2 bg-spotify-purple text-white text-xs">Host</Badge>
                  )}
                  {user.isPremium && (
                    <Badge className="ml-2 bg-spotify-green text-white text-xs">Premium</Badge>
                  )}
                </div>
                <div className="flex items-center text-xs text-spotify-subtext">
                  {user.isMicOn ? (
                    <span className="flex items-center text-spotify-green">
                      <Mic className="h-3 w-3 mr-1" /> Speaking
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <MicOff className="h-3 w-3 mr-1" /> Muted
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isHost && user.id !== hostId && (
              <div className="flex items-center">
                <span className="text-xs text-spotify-subtext mr-2">Can add songs</span>
                <Switch 
                  checked={user.hasAddToQueuePermission} 
                  onCheckedChange={() => onTogglePermission(user.id)}
                />
              </div>
            )}
          </div>
        ))}
        

      </div>
    </div>
  );
};

export default ParticipantsList;
