import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '@/hooks/use-jam-session';
import { doc, setDoc, deleteField, updateDoc, onSnapshot } from 'firebase/firestore';

const VoiceChat = ({ roomId, userId }) => {
  const [peerId, setPeerId] = useState(null);
  const [peers, setPeers] = useState({});
  const localStreamRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const connectionsRef = useRef({});

  // 🔊 Init PeerJS and mic
  useEffect(() => {
    const peer = new Peer();
    peerInstanceRef.current = peer;

    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }).then((stream) => {
      localStreamRef.current = stream;

      peer.on('open', async (id) => {
        setPeerId(id);
        const userDoc = doc(db, 'rooms', roomId);
        await updateDoc(userDoc, {
          [`participants.${userId}.peerId`]: id,
          [`participants.${userId}.isMicOn`]: true,
        });
      });

      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          if (call.peer !== peerInstanceRef.current?.id) { // Don't play our own audio
            attachRemoteAudio(call.peer, remoteStream);
          }
        });
      });
    }).catch(err => {
      console.error('Failed to get microphone access:', err);
    });

    return () => {
      // Close all peer connections
      Object.values(connectionsRef.current).forEach(call => call.close());
      
      // Cleanup local media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Destroy peer instance
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
      }
      
      // Cleanup Firestore
      const userDoc = doc(db, 'rooms', roomId);
      updateDoc(userDoc, {
        [`participants.${userId}.peerId`]: deleteField(),
        [`participants.${userId}.isMicOn`]: false,
      }).catch(err => console.error('Firestore cleanup error:', err));
    };
  }, [roomId, userId]);

  // 📡 Listen for other participants' peer IDs
  useEffect(() => {
    if (!peerId) return;

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      const data = docSnap.data();
      if (!data?.participants) return;

      Object.entries(data.participants).forEach(([id, info]) => {
        if (
          id !== userId && // Not ourselves
          info.peerId && // Has a peer ID
          info.peerId !== peerId && // Not our own peer ID
          !connectionsRef.current[info.peerId] // Not already connected
        ) {
          const call = peerInstanceRef.current.call(info.peerId, localStreamRef.current);
          call.on('stream', (remoteStream) => {
            attachRemoteAudio(info.peerId, remoteStream);
          });
          connectionsRef.current[info.peerId] = call;
        }
      });
    });

    return () => unsub();
  }, [peerId, roomId, userId]);

  // 🎤 Attach remote audio to DOM
  const attachRemoteAudio = (peerId, stream) => {
    if (peers[peerId]) return;

    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.volume = 1.0;
    
    setPeers((prev) => ({ ...prev, [peerId]: audio }));
  };

  return (
    <div className="p-4 rounded-xl bg-gray-900 text-white shadow-xl hidden">
      <h2 className="text-xl font-bold mb-2">🎙 Voice Chat Active</h2>
      <p className="text-sm text-gray-400">Connected as: <strong>{userId}</strong></p>
      <ul className="mt-2 list-disc list-inside">
        {Object.keys(peers).map((pid) => (
          <li key={pid}>🔊 Connected to: {pid}</li>
        ))}
      </ul>
    </div>
  );
};

export default VoiceChat;