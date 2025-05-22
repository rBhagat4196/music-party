
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share, Link, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ShareRoomDialogProps {
  roomId: string;
  roomName: string;
}

const ShareRoomDialog: React.FC<ShareRoomDialogProps> = ({ roomId, roomName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/jam-session?room=${roomId}`;

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      
      toast({
        title: "Link Copied!",
        description: "Share it with your friends to invite them to your jam session.",
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my Spotify Jam: ${roomName}`,
          text: "Join my music listening session on Spotify!",
          url: shareUrl,
        });
        
        toast({
          title: "Shared Successfully!",
          description: "Your friends can now join your jam session.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // If share is canceled or fails, fallback to copy
        handleCopy();
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopy();
    }
  };

  // Generate QR code here if needed
  // For now we're just focusing on sharing the link

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => setIsOpen(true)}
          variant="outline" 
          size="sm"
          className="bg-spotify-dark-highlight border-none text-white hover:bg-spotify-purple/30"
        >
          <Share className="h-4 w-4 mr-2" /> Share Room
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-spotify-dark-elevated border-spotify-dark-highlight sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{roomName}"</DialogTitle>
          <DialogDescription className="text-spotify-subtext">
            Invite friends to join your jam session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="shareLink" className="text-sm font-medium">
              Room Link
            </label>
            <div className="flex">
              <Input
                id="shareLink"
                ref={inputRef}
                value={shareUrl}
                readOnly
                className="bg-spotify-dark-highlight border-none focus-visible:ring-spotify-purple text-white rounded-r-none"
              />
              <Button
                onClick={handleCopy}
                className={`rounded-l-none ${
                  isCopied 
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-spotify-purple hover:bg-spotify-purple/80'
                }`}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Room Code
            </label>
            <div className="flex items-center justify-center p-4 bg-spotify-dark-highlight rounded-md">
              <span className="text-2xl font-bold tracking-wider text-spotify-purple select-all">
                {roomId}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleShare}
              className="flex-1 bg-spotify-green hover:bg-spotify-light-green text-black font-medium"
            >
              <Share className="h-4 w-4 mr-2" /> Share
            </Button>
            
            <Button 
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1 bg-spotify-dark-highlight border-none hover:bg-spotify-dark-highlight/80"
            >
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRoomDialog;
