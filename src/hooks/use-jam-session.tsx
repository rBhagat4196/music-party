import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/ui/use-toast";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  runTransaction,
  deleteField,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Types
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isPremium: boolean;
  isMicOn: boolean;
  hasAddToQueuePermission: boolean;
  lastActive?: Date;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  addedBy: string;
  addedAt?: Date;
  songURL?:string;
};

export type Room = {
  id?: string;
  name: string;
  hostId: string;
  participants: Record<string, User>;
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  position: number;
  lastUpdated: Date;
};

export const useJamSession = (roomId?: string) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "",
    name: "Guest",
    isPremium: false,
    isMicOn: false,
    hasAddToQueuePermission: false,
  });
  const [room, setRoom] = useState<Room | null>(null);
  const [idroom, setidroom] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [position, setPosition] = useState(0);

  const { toast } = useToast();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Initialize current user
  useEffect(() => {
    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentUser({
      id: userId,
      name: `User ${userId.substr(5, 4)}`,
      avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
      isPremium: true,
      isMicOn: false,
      hasAddToQueuePermission: true,
      lastActive: new Date(),
    });
  }, []);

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [unsubscribe]);

  // Create a new room
  const createRoom = async (roomName: string) => {
    setIsConnecting(true);

    try {
      const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
      const roomRef = doc(db, "rooms", roomId);

      const newRoom: Room = {
        id: roomId,
        name: roomName,
        hostId: currentUser.id,
        participants: {
          [currentUser.id]: currentUser,
        },
        currentSong: null,
        isPlaying: false,
        position: 0,
        queue: [],
        lastUpdated: new Date(),
      };

      setidroom(roomId);
      await setDoc(roomRef, newRoom);
      setupRoomListener(roomRef.id);

      setIsHost(true);
      setIsConnected(true);
      setRoom(newRoom);
      toast({
        title: "Room Created!",
        description: `Your room "${roomName}" is ready to jam.`,
      });

      return roomRef.id;
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error Creating Room",
        description: "Could not create the room. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Join an existing room
  const joinRoom = async (roomIdToJoin: string) => {
    setIsConnecting(true);

    try {
      const roomRef = doc(db, "rooms", roomIdToJoin);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        toast({
          title: "Error Joining Room",
          description: "The room doesn't exist or has expired.",
          variant: "destructive",
        });
        return false;
      }

      const roomData = roomSnap.data() as Room;
      const now = new Date();
      const lastUpdated = roomData.lastUpdated.toDate();

      // Calculate the correct position based on playback status
      let calculatedPosition = roomData.position;
      if (roomData.isPlaying && roomData.currentSong) {
        const elapsedSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
        calculatedPosition = (roomData.position + elapsedSeconds) % roomData.currentSong.duration;
      }

      // Add user to participants
      await updateDoc(roomRef, {
        [`participants.${currentUser.id}`]: currentUser,
        lastUpdated: new Date(),
      });

      setidroom(roomIdToJoin);
      setupRoomListener(roomIdToJoin);

      setIsConnected(true);
      setIsHost(roomData.hostId === currentUser.id);
      setPosition(calculatedPosition);

      toast({
        title: "Joined Successfully!",
        description: `You've joined "${roomData.name}".`,
      });

      return true;
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error Joining Room",
        description: "Could not join the room. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Set up real-time listener for room changes
  const setupRoomListener = (roomId: string) => {
    const roomRef = doc(db, "rooms", roomId);

    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as Room;
        const now = new Date();
        const lastUpdated = roomData.lastUpdated.toDate();

        // Calculate current position
        let calculatedPosition = roomData.position;
        if (roomData.isPlaying && roomData.currentSong) {
          const elapsedSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
          calculatedPosition = (roomData.position + elapsedSeconds) % roomData.currentSong.duration;
        }

        setRoom({
          ...roomData,
          position: calculatedPosition,
          lastUpdated: now
        });
        setIsHost(roomData.hostId === currentUser.id);
        setPosition(calculatedPosition);
      } else {
        setRoom(null);
        setIsConnected(false);
        toast({
          title: "Room Closed",
          description: "The host has closed the room.",
        });
      }
    });

    setUnsubscribe(() => unsubscribe);
  };

  // Toggle play/pause
  const togglePlay = async () => {
    if (!room || !room.id) return;

    try {
      const now = new Date();
      let newPosition = position;
      
      if (room.isPlaying) {
        // Pausing - store the current position
        newPosition = position;
      } else {
        // Playing - calculate the position based on last update
        const elapsedSeconds = Math.floor((now.getTime() - room.lastUpdated.getTime()) / 1000);
        newPosition = (room.position + elapsedSeconds) % (room.currentSong?.duration || 1);
      }

      await updateDoc(doc(db, "rooms", room.id), {
        isPlaying: !room.isPlaying,
        position: newPosition,
        lastUpdated: now,
      });
    } catch (error) {
      console.error("Error toggling play state:", error);
    }
  };

  // Toggle user's microphone
  const toggleMic = useCallback(async () => {
    const newMicState = !currentUser.isMicOn;
    setCurrentUser((prev) => ({ ...prev, isMicOn: newMicState }));

    if (room?.id) {
      try {
        await updateDoc(doc(db, "rooms", room.id), {
          [`participants.${currentUser.id}.isMicOn`]: newMicState,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error("Error toggling mic:", error);
      }
    }
  }, [currentUser.id, currentUser.isMicOn, room]);

  // Add song to queue
  const addToQueue = useCallback(
    async (song: Song) => {
      if (!room?.id) return;

      const songWithMetadata = {
        ...song,
        id: `song-${Date.now()}`,
        addedBy: currentUser.id,
        addedAt: new Date(),
      };

      try {
        await updateDoc(doc(db, "rooms", room.id), {
          queue: arrayUnion(songWithMetadata),
          lastUpdated: new Date(),
        });

        if (!room.currentSong) {
          await updateDoc(doc(db, "rooms", room.id), {
            currentSong: songWithMetadata,
            isPlaying: true,
            position: 0,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error("Error adding to queue:", error);
      }
    },
    [currentUser.id, room]
  );

  // Skip current track
  const skipTrack = useCallback(async () => {
    if (!room?.id || !room.queue || room.queue.length === 0) return;

    try {
      await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, "rooms", room.id);
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) return;

        const currentQueue = roomSnap.data().queue || [];
        if (currentQueue.length === 0) return;

        const nextSong = currentQueue[0];
        const newQueue = currentQueue.slice(1);

        transaction.update(roomRef, {
          currentSong: nextSong,
          queue: newQueue,
          isPlaying: true,
          position: 0,
          lastUpdated: new Date(),
        });
      });

      setPosition(0);
    } catch (error) {
      console.error("Error skipping track:", error);
    }
  }, [room]);

  // Leave the room
  const leaveRoom = useCallback(async () => {
    if (!room?.id) return;

    try {
      await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, "rooms", room.id);
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) return;

        const updates = {
          [`participants.${currentUser.id}`]: deleteField(),
          lastUpdated: new Date(),
        };

        if (isHost) {
          const participants = roomSnap.data().participants || {};
          const otherParticipants = Object.keys(participants).filter(
            (id) => id !== currentUser.id
          );

          if (otherParticipants.length > 0) {
            updates.hostId = otherParticipants[0];
          } else {
            transaction.delete(roomRef);
          }
        }

        transaction.update(roomRef, updates);
      });

      if (unsubscribe) unsubscribe();
      setUnsubscribe(null);
      setRoom(null);
      setIsConnected(false);
      setIsHost(false);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }, [currentUser.id, isHost, room, unsubscribe]);

  // Toggle permission for a user
  const togglePermission = useCallback(
    async (userId: string) => {
      if (!room?.id || !isHost) return;

      try {
        const roomRef = doc(db, "rooms", room.id);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const currentPermission =
            roomSnap.data()?.participants?.[userId]?.hasAddToQueuePermission || false;

          await updateDoc(roomRef, {
            [`participants.${userId}.hasAddToQueuePermission`]: !currentPermission,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error("Error updating permissions:", error);
      }
    },
    [isHost, room]
  );

  // Update position for progress bar
  useEffect(() => {
    if (!room || !room.isPlaying || !room.currentSong) return;

    const intervalId = setInterval(() => {
      setPosition((prevPosition) => {
        const newPosition = prevPosition + 1;
        if (newPosition >= room.currentSong!.duration) {
          skipTrack();
          return 0;
        }
        return newPosition;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [room?.isPlaying, room?.currentSong, skipTrack]);

  // Join room if roomId is provided
  useEffect(() => {
    if (!roomId) return;

    joinRoom(roomId);

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  return {
    idroom,
    currentUser,
    room,
    isHost,
    isConnecting,
    isConnected,
    position,
    actions: {
      createRoom,
      joinRoom,
      togglePlay,
      toggleMic,
      addToQueue,
      skipTrack,
      leaveRoom,
      togglePermission,
    },
  };
};