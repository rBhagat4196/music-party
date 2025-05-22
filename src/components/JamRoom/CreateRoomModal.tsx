
import { useState } from 'react';
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface CreateRoomModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (roomName: string) => Promise<string>;
  isConnecting: boolean;
  isPremium: boolean;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onOpenChange,
  onCreateRoom,
  isConnecting,
  isPremium,
}) => {
  const [roomName, setRoomName] = useState('');
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPremium) {
      toast({
        title: "Premium Required",
        description: "Only premium users can create jam sessions.",
        variant: "destructive",
      });
      return;
    }

    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for your jam session.",
        variant: "destructive",
      });
      return;
    }

    await onCreateRoom(roomName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-spotify-dark-elevated border-spotify-dark-highlight sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Jam Session</DialogTitle>
          <DialogDescription className="text-spotify-subtext">
            Set up a room where friends can join and listen to music together.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Session Name</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="bg-spotify-dark-highlight border-none focus-visible:ring-spotify-green text-white"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-spotify-green hover:bg-spotify-light-green text-black font-medium"
            disabled={isConnecting || !isPremium}
          >
            {isConnecting ? "Creating..." : "Create Session"}
          </Button>
          
          {!isPremium && (
            <p className="text-center text-xs text-amber-400">
              Only Spotify Premium users can create jam sessions
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomModal;
