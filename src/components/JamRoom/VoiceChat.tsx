import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '@/hooks/use-jam-session';
import { doc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';

const VoiceChat = ({ roomId, userId, isMicOn }) => {
  const [peerId, setPeerId] = useState(null);
  const [peers, setPeers] = useState({});
  const localStreamRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const connectionsRef = useRef({});

  // 🔊 Init Peer and microphone stream
  useEffect(() => {
    const peer = new Peer();
    peerInstanceRef.current = peer;

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }).then((stream) => {
      localStreamRef.current = stream;

      // Enable or disable mic based on prop
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });

      peer.on('open', async (id) => {
        setPeerId(id);
        const userDoc = doc(db, 'rooms', roomId);
        await updateDoc(userDoc, {
          [`participants.${userId}.peerId`]: id,
          [`participants.${userId}.isMicOn`]: isMicOn,
        });
      });

      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          if (call.peer !== peerInstanceRef.current?.id) {
            attachRemoteAudio(call.peer, remoteStream);
          }
        });
      });
    }).catch(err => {
      console.error('Microphone access error:', err);
    });

    return () => {
      Object.values(connectionsRef.current).forEach(call => call.close());

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
      }

      const userDoc = doc(db, 'rooms', roomId);
      updateDoc(userDoc, {
        [`participants.${userId}.peerId`]: deleteField(),
        [`participants.${userId}.isMicOn`]: false,
      }).catch(console.error);
    };
  }, [roomId, userId]);

  // 🔁 Sync isMicOn changes to mic + Firestore
  useEffect(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = isMicOn;
    });

    const userDoc = doc(db, 'rooms', roomId);
    updateDoc(userDoc, {
      [`participants.${userId}.isMicOn`]: isMicOn,
    });
  }, [isMicOn]);

  // 📡 Handle remote connections
  useEffect(() => {
    if (!peerId) return;

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      const data = docSnap.data();
      if (!data?.participants) return;

      Object.entries(data.participants).forEach(([id, info]) => {
        if (
          id !== userId &&
          info.peerId &&
          !connectionsRef.current[info.peerId] &&
          info.isMicOn
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

  const attachRemoteAudio = (peerId, stream) => {
    if (peers[peerId]) return;

    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;

    setPeers((prev) => ({ ...prev, [peerId]: audio }));
  };

  return (
    <div className="p-4 rounded-xl bg-gray-900 text-white shadow-xl hidden">
      <h2 className="text-xl font-bold mb-2">🎙 Voice Chat</h2>
      <p className="text-sm text-gray-400">User: <strong>{userId}</strong></p>
      <p className="text-sm text-gray-400">Mic is: <strong>{isMicOn ? 'ON 🎤' : 'OFF 🔇'}</strong></p>

      <ul className="mt-4 list-disc list-inside text-sm text-green-400">
        {Object.keys(peers).map((pid) => (
          <li key={pid}>🔊 Listening to: {pid}</li>
        ))}
      </ul>
    </div>
  );
};

export default VoiceChat;
