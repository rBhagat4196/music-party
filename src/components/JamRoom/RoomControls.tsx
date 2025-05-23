import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, Mic, MicOff, Volume, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Song } from "@/hooks/use-jam-session";
import VoiceChat from "./VoiceChat";
import MusicPlayer from "./MusicPlayer";
interface RoomControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  isMicOn: boolean;
  isHost: boolean;
  onTogglePlay: () => void;
  onToggleMic: () => void;
  onSkip: () => void;
  onLeave: () => void;
  roomId: string;
  userId: string;
}

const RoomControls: React.FC<RoomControlsProps> = ({
  currentSong,
  isPlaying,
  position,
  isMicOn,
  isHost,
  onTogglePlay,
  onToggleMic,
  onSkip,
  onLeave,
  roomId,
  userId,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [count, setCount] = useState(position);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      setCount(position);
      intervalRef.current = setInterval(() => {
        setCount((prev) => prev + 1);
      }, 1000); // Update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, position]);

  const progress = currentSong ? (count / currentSong.duration) * 100 : 0;
  console.log(position);
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-elevated border-t border-spotify-dark-highlight p-4 shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto">
        {/* Current Song Info */}
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          {currentSong ? (
            <>
              <img
                src={currentSong.albumArt}
                alt={`${currentSong.title} album art`}
                className="w-14 h-14 rounded shadow-md"
              />
              <div>
                <h3 className="font-medium text-white">{currentSong.title}</h3>
                <p className="text-sm text-spotify-subtext">
                  {currentSong.artist}
                </p>
              </div>
            </>
          ) : (
            <div className="text-spotify-subtext">No song playing</div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center w-full md:w-1/2">
          <div className="flex items-center space-x-4 mb-2">
            <Button
              onClick={onTogglePlay}
              disabled={!currentSong}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-spotify-green hover:scale-105 transition-all"
            >
              {isPlaying ? (
                <div>
                  <Pause className="h-5 w-5" />
                </div>
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              onClick={onSkip}
              disabled={!isHost}
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full text-spotify-subtext hover:text-white",
                !isHost && "opacity-50 cursor-not-allowed"
              )}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <MusicPlayer
            musicUrl={
              !currentSong?.songURL
                ? "https://firebasestorage.googleapis.com/v0/b/imageurl-d1144.appspot.com/o/d42ac219-9935-4aa5-9f08-1a3a207422d6?alt=media&token=e342d5d4-0c6c-40dc-a4ec-d09b1808221d"
                : currentSong.songURL
            }
            position={position}
            isPlaying={isPlaying}
          />

          <div className="flex items-center w-full space-x-2">
            <span className="text-xs text-spotify-subtext w-8">
              {formatTime(count)}
            </span>
            <div className="w-full">
              <Slider
                value={[progress]}
                max={100}
                step={1}
                className="cursor-pointer"
                disabled
              />
            </div>
            <span className="text-xs text-spotify-subtext w-8">
              {currentSong ? formatTime(currentSong.duration) : "0:00"}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            onClick={onToggleMic}
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full",
              isMicOn
                ? "bg-spotify-green text-white hover:bg-spotify-green/90"
                : "text-spotify-subtext hover:text-white"
            )}
          >
            {isMicOn ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          <VoiceChat roomId={roomId} userId={userId} isMicOn={isMicOn}/>

          <div className="hidden md:flex items-center space-x-2">
            <Volume className="h-4 w-4 text-spotify-subtext" />
            <Slider defaultValue={[70]} max={100} step={1} className="w-24" />
          </div>

          <Button
            onClick={onLeave}
            variant="ghost"
            size="sm"
            className="rounded-full text-spotify-subtext hover:text-white hover:bg-red-500/20"
          >
            <X className="h-4 w-4 mr-1" /> Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomControls;
