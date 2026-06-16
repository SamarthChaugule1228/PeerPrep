import { useRef, useState, useEffect, useCallback } from 'react';

const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export const useWebRTC = (socketRef, sessionId, isInitiator) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);   // MediaStream or null
  const screenTrackRef = useRef(null);

  // Start local media: try video+audio, fallback to audio-only, then none
  const startMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicOn(true);
      setCamOn(true);
      setMediaError(null);
      return stream;
    } catch (err) {
      console.warn('Camera+Mic not available:', err.message);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setMicOn(true);
        setCamOn(false);
        setMediaError('Camera not available. You can still share your screen.');
        return audioStream;
      } catch (audioErr) {
        console.warn('Microphone not available:', audioErr.message);
        localStreamRef.current = null;
        setLocalStream(null);
        setMicOn(false);
        setCamOn(false);
        setMediaError('No camera or microphone found. You can still use the code editor and screen share.');
        return null;
      }
    }
  }, []);

  // Create peer connection (always with a video transceiver for screen sharing)
  const createPeer = useCallback((stream) => {
    const peer = new RTCPeerConnection(iceServers);
    peerRef.current = peer;

    // Add audio / video tracks from stream if present
    if (stream) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    // Ensure we always have a video transceiver (even without camera) for screen share
    if (!stream || !stream.getVideoTracks().length) {
      peer.addTransceiver('video', { direction: 'sendonly' });
    }

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { sessionId, candidate: event.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      setConnectionStatus(peer.connectionState);
    };

    return peer;
  }, [sessionId, socketRef]);

  // Initiate call (only if initiator)
  const initiateCall = useCallback(async () => {
    if (!socketRef.current) return;
    const stream = localStreamRef.current;
    const peer = createPeer(stream);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.emit('offer', { sessionId, offer });
  }, [createPeer, sessionId, socketRef]);

  // Listen for signalling
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleOffer = async (offer) => {
      await startMedia(); // ensure media is started (or null)
      const stream = localStreamRef.current;
      if (peerRef.current) peerRef.current.close();
      const peer = createPeer(stream);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('answer', { sessionId, answer });
    };

    const handleAnswer = async (answer) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async (candidate) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('ICE add error:', err);
        }
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    startMedia();

    let callTimeout;
    if (isInitiator) {
      callTimeout = setTimeout(() => {
        initiateCall();
      }, 2500);
    }

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      clearTimeout(callTimeout);
      if (peerRef.current) peerRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [socketRef, sessionId, isInitiator, startMedia, createPeer, initiateCall]);

  // Mic / cam toggles
  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  // Screen sharing (always via replaceTrack on existing video sender)
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }
      }
      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Restore camera video track (if any), otherwise leave sender without track
    if (peerRef.current) {
      const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        const stream = localStreamRef.current;
        const videoTrack = stream ? stream.getVideoTracks()[0] : null;
        if (videoTrack) {
          sender.replaceTrack(videoTrack);
        } else {
          sender.replaceTrack(null); // sends black/no video, remote will see frozen frame
        }
      }
    }
    setScreenSharing(false);
  };

  return {
    localStream,
    remoteStream,
    connectionStatus,
    micOn,
    camOn,
    screenSharing,
    mediaError,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
  };
};