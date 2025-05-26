import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJamSession } from "@/hooks/use-jam-session";
import RoomControls from "@/components/JamRoom/RoomControls";
import QueueList from "@/components/JamRoom/QueueList";
import ParticipantsList from "@/components/JamRoom/ParticipantsList";
import AddToQueueDialog from "@/components/JamRoom/AddToQueueDialog";
import JoinRoomModal from "@/components/JamRoom/JoinRoomModal";
import CreateRoomModal from "@/components/JamRoom/CreateRoomModal";
import ShareRoomDialog from "@/components/JamRoom/ShareRoomDialog";
const JamSession = () => {
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get("room");

  const {
    currentUser,
    room,
    isHost,
    isConnecting,
    isConnected,
    position,
    actions,
  } = useJamSession(roomIdFromUrl || undefined);

  // console.log("current user", currentUser);
  // console.log("room", room);


  // console.log("isHost", isHost);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addToQueueDialogKey, setAddToQueueDialogKey] = useState(0);
  const [queueDialogRef, setQueueDialogRef] = useState<HTMLDivElement | null>(
    null
  );

  const canAddToQueue =
    isHost ||
    (Object.values(room?.participants || {}).find(
      (p) => p.id === currentUser.id
    )?.hasAddToQueuePermission ??
      false);

  const handleAddToQueue = () => {
    setAddToQueueDialogKey((prev) => prev + 1);
    setTimeout(() => {
      if (queueDialogRef) {
        const dialogTrigger = queueDialogRef.querySelector(
          '[data-state="closed"]'
        ) as HTMLElement;
        if (dialogTrigger) {
          dialogTrigger.click();
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark to-black pb-28">
      <div className="max-w-7xl mx-auto p-4">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12">
            <Card className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 w-full max-w-md text-center">
              <h1 className="text-4xl font-bold mb-2 text-white">
                Tune-Talk Jam
              </h1>
              <p className="text-spotify-subtext mb-8">
                Create or join a real-time music session with friends
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full bg-spotify-green hover:bg-spotify-light-green text-black font-medium text-lg py-6"
                >
                  Create a Jam Session
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-spotify-dark-highlight" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-spotify-dark-elevated px-4 text-spotify-subtext">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsJoinModalOpen(true)}
                  variant="outline"
                  className="w-full bg-spotify-dark-highlight hover:bg-spotify-dark-highlight/80 text-white border-none py-6 text-lg"
                >
                  Join a Session
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 py-6">
              <div className="w-full md:w-7/12">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{room?.name}</h1>
                    <p className="text-spotify-subtext">
                      {Object.keys(room?.participants || {}).length}{" "}
                      {Object.keys(room?.participants || {}).length === 1
                        ? "person"
                        : "people"}{" "}
                      in this jam
                    </p>
                  </div>

                  {isHost && room && (
                    <ShareRoomDialog roomId={room.id} roomName={room.name} />
                  )}
                </div>

                {room?.currentSong ? (
                  <Card className="bg-spotify-dark-elevated border-spotify-dark-highlight overflow-hidden mb-6">
                    <div className="relative">
                      <img
                        src={room.currentSong.albumArt}
                        alt={`${room.currentSong.title} album cover`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-spotify-dark/90 flex items-end p-6">
                        <div>
                          <h2 className="text-2xl font-bold text-shadow">
                            {room.currentSong.title}
                          </h2>
                          <p className="text-lg text-spotify-subtext">
                            {room.currentSong.artist}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-spotify-dark-elevated border-spotify-dark-highlight p-12 mb-6 text-center">
                    <p className="text-xl text-spotify-subtext">
                      No song currently playing
                    </p>
                    {canAddToQueue && (
                      <Button
                        onClick={handleAddToQueue}
                        className="mt-4 bg-spotify-green hover:bg-spotify-light-green text-black"
                      >
                        Add a Song to Start
                      </Button>
                    )}
                  </Card>
                )}

                <div ref={setQueueDialogRef}>
                  <AddToQueueDialog
                    // key={addToQueueDialogKey}
                    onAddSong={actions.addToQueue}
                  />
                  <QueueList
                    queue={room?.queue || []}
                    onAddToQueue={handleAddToQueue}
                    canAddToQueue={canAddToQueue}
                  />
                </div>
              </div>

              <div className="w-full md:w-5/12">
                {room && (
                  <ParticipantsList
                    participants={Object.values(room.participants || {})}
                    hostId={room.hostId}
                    isHost={isHost}
                    onTogglePermission={actions.togglePermission}
                    room = {room}
                  />
                )}
              </div>


            </div>
          </>
        )}
      </div>


      {isConnected && room && (
        <RoomControls
          currentSong={room.currentSong}
          isPlaying={room.isPlaying}
          position={position}
          isMicOn={currentUser.isMicOn}
          isHost={isHost}
          onTogglePlay={actions.togglePlay}
          onToggleMic={actions.toggleMic}
          onSkip={actions.skipTrack}
          onLeave={actions.leaveRoom}
          userId = {currentUser?.id}
          roomId = {room?.id}
        />
      )}

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onOpenChange={setIsJoinModalOpen}
        onJoinRoom={actions.joinRoom}
        isConnecting={isConnecting}
      />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateRoom={actions.createRoom}
        isConnecting={isConnecting}
        isPremium={currentUser.isPremium}
      />

      

    </div>
  );
};

export default JamSession;
