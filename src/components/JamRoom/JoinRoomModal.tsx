
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

interface JoinRoomModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinRoom: (roomId: string) => Promise<boolean>;
  isConnecting: boolean;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onOpenChange,
  onJoinRoom,
  isConnecting,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a valid room code to join.",
        variant: "destructive",
      });
      return;
    }

    await onJoinRoom(roomCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-spotify-dark-elevated border-spotify-dark-highlight sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Jam Session</DialogTitle>
          <DialogDescription className="text-spotify-subtext">
            Enter the room code shared by your friend to join their jam session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="bg-spotify-dark-highlight border-none focus-visible:ring-spotify-green text-white"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-spotify-green hover:bg-spotify-light-green text-black font-medium"
            disabled={isConnecting}
          >
            {isConnecting ? "Joining..." : "Join Session"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomModal;
