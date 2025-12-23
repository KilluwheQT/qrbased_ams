'use client';

import { useEffect, useState, useRef } from 'react';
import jsQR from 'jsqr';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/components/ui/ToastContext';

export default function QRScannerComponent() {
  const { user } = useAuth();
  const [scanMode, setScanMode] = useState('menu'); // 'menu', 'camera', 'upload'
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  // Debug helpers
  const [debugMode, setDebugMode] = useState(false);
  const [videoInfo, setVideoInfo] = useState({ readyState: 0, width: 0, height: 0, tracks: 0, playing: false, srcObject: false });
  // Scan debugging
  const [lastScanAttempt, setLastScanAttempt] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [qrCorners, setQrCorners] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const scanFrameRef = useRef(null);
  const lastScannedRef = useRef('');
  const pollRef = useRef(null);
  // retry helper for attaching stream to video element
  const attachRetryRef = useRef(null);
  const autoStartRef = useRef(false);

  // Helper that attempts to attach stream to a video element, with retries
  const attachStreamToVideo = async (video, stream, { maxAttempts = 12, baseDelay = 200 } = {}) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Assign srcObject and check
        try { video.srcObject = stream; } catch (e) { console.warn('srcObject assignment failed', e); }
        if (video.srcObject) return true;
      } catch (e) {
        console.warn('attach attempt error', e);
      }
      // backoff
      await new Promise((r) => setTimeout(r, baseDelay * (attempt + 1)));
    }
    return !!video.srcObject;
  };

  // Ensure camera stream is attached and playback starts (used on modal open)
  const ensureCameraStream = async () => {
    if (autoStartRef.current) {
      console.log('ensureCameraStream: already running');
      return;
    }
    autoStartRef.current = true;
    try {
      // If we don't have a stream yet, try to get one
      if (!streamRef.current) {
        try {
          showMessage('Requesting camera access...', 'info');
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          streamRef.current = s;
        } catch (err) {
          console.error('ensureCameraStream getUserMedia failed', err);
          showMessage('Camera permission needed. Please allow camera access.', 'error');
          return;
        }
      }

      // Wait a bit for the modal and video element to be present
      let tries = 0;
      while (!videoRef.current && tries < 20) {
        await new Promise((r) => setTimeout(r, 100));
        tries++;
      }

      if (!videoRef.current) {
        console.warn('ensureCameraStream: video element not available');
        showMessage('Video element not available. Try pressing Retry.', 'error');
        return;
      }

      const v = videoRef.current;

      const attached = await attachStreamToVideo(v, streamRef.current, { maxAttempts: 20, baseDelay: 100 });
      if (!attached) {
        console.warn('ensureCameraStream: failed to attach stream');
        showMessage('Could not attach camera automatically. Press Retry.', 'error');
        return;
      }

      try {
        await v.play();
        setLoading(false);
        showMessage('✓ Camera ready. Point at QR code.', 'success');
        if (!scanFrameRef.current) scanFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.warn('ensureCameraStream play() failed', err);
        // wait for loadedmetadata as fallback
        v.addEventListener('loadedmetadata', () => {
          v.play().then(() => {
            setLoading(false);
            showMessage('✓ Camera ready. Point at QR code.', 'success');
            if (!scanFrameRef.current) scanFrameRef.current = requestAnimationFrame(scanFrame);
          }).catch((e) => console.error('play after metadata failed', e));
        }, { once: true });
      }
    } finally {
      autoStartRef.current = false;
    }
  };

  const { push } = useToast();

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (push) push(msg, { type: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info' });
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Process QR data (image or camera)
  const decodeQRCode = (imageData, width, height) => {
    try {
      const code = jsQR(imageData.data, width, height);
      return code ? code.data : null;
    } catch (err) {
      console.error('QR decode error:', err);
      return null;
    }
  };

  // Camera scanning loop
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || scanMode !== 'camera') return;

    setLastScanAttempt(Date.now());

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('Canvas context unavailable');
        if (scanMode === 'camera') scanFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || canvas.width || 640;
        canvas.height = video.videoHeight || canvas.height || 480;
        setCanvasSize({ w: canvas.width, h: canvas.height });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Debug info
        if (debugMode) {
          console.debug('Scanning frame', { w: canvas.width, h: canvas.height, dataLen: imageData.data.length });
        }

        const qr = decodeQRCode(imageData, canvas.width, canvas.height);

        if (qr) {
          console.log('QR detected:', qr);
          setLastScanResult(qr);

          // Try to get location from jsQR - jsQR returns an object with .data and .location
          try {
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code?.location) {
              const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location;
              setQrCorners([topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]);
            } else {
              setQrCorners(null);
            }
          } catch (e) {
            console.warn('Failed to parse location:', e);
            setQrCorners(null);
          }

          if (qr !== lastScannedRef.current) {
            lastScannedRef.current = qr;
            stopCamera();
            await handleQrScan(qr);
            return;
          }
        } else {
          // no qr detected
          if (debugMode) console.debug('No QR in this frame');
        }
      } else {
        if (debugMode) console.debug('Video not ready', video.readyState);
      }
    } catch (err) {
      console.error('Scan frame error:', err);
    }

    if (scanMode === 'camera') {
      scanFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      showMessage('Requesting camera access...', 'info');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;

      // Show the camera modal immediately so users see permission prompts/messages
      setScanMode('camera');

      // Wait up to ~1s for modal to render and video ref to be available
      let tries = 0;
      while (!videoRef.current && tries < 10) {
        await new Promise((r) => setTimeout(r, 100));
        tries++;
      }

      if (!videoRef.current) {
        console.warn('Video element not available after render. Will keep retrying in background.');
        setLoading(false);
        showMessage('Waiting for video element to render... automatically retrying', 'info');
      }

      const video = videoRef.current;

      const updateInfo = () => {
        if (!videoRef.current) return;
        const v = videoRef.current;
        setVideoInfo({
          readyState: v.readyState,
          width: v.videoWidth,
          height: v.videoHeight,
          tracks: streamRef.current?.getTracks?.().length || 0,
          playing: !v.paused && !v.ended && v.readyState > 2,
          srcObject: !!v.srcObject
        });
      };

      // Try to attach stream and play (with retries)
      const attemptAttachAndPlay = async () => {
        try {
          if (!videoRef.current) return false;
          const v = videoRef.current;
          const attached = await attachStreamToVideo(v, streamRef.current);
          if (!attached) {
            console.warn('attachStreamToVideo failed');
            return false;
          }

          // try immediate play
          try {
            await v.play();
            updateInfo();
            setLoading(false);
            showMessage('✓ Camera ready. Point at QR code.', 'success');
            scanFrameRef.current = requestAnimationFrame(scanFrame);
            return true;
          } catch (playErr) {
            console.warn('play() failed after attach, will wait for loadedmetadata', playErr);
            const onLoaded = () => {
              v.play().then(() => {
                updateInfo();
                setLoading(false);
                showMessage('✓ Camera ready. Point at QR code.', 'success');
                scanFrameRef.current = requestAnimationFrame(scanFrame);
              }).catch((e) => {
                console.error('play failed after loadedmetadata', e);
              });
            };
            v.addEventListener('loadedmetadata', onLoaded, { once: true });
            return true; // we attached; will try to start when loaded
          }
        } catch (err) {
          console.warn('Attempt attach and play error', err);
          return false;
        }
      };

      // First immediate attempt
      const ok = await attemptAttachAndPlay();

      if (!ok) {
        // schedule background retries (auto) until success for a short period
        if (attachRetryRef.current) clearInterval(attachRetryRef.current);
        let attemptCount = 0;
        attachRetryRef.current = setInterval(async () => {
          attemptCount++;
          console.log('Auto attach retry attempt', attemptCount);
          const success = await attemptAttachAndPlay();
          if (success || attemptCount > 20) {
            clearInterval(attachRetryRef.current);
            attachRetryRef.current = null;
            if (!success) {
              showMessage('Could not start camera automatically; press Retry to try again', 'error');
              setLoading(false);
            }
          }
        }, 500);
      }

      // Start periodic updates so debug info shows changes
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        try { updateInfo(); } catch (e) { /* ignore */ }
      }, 500);
    } catch (err) {
      console.error('Camera error:', err);
      let msg = 'Camera Error: ';
      if (err.name === 'NotAllowedError') msg += 'Permission denied. Check browser settings.';
      else if (err.name === 'NotFoundError') msg += 'No camera found.';
      else msg += err.message;
      showMessage(msg, 'error');
      setLoading(false);
      // Keep modal open to show instructions so users can change permissions
      setScanMode('camera');
    }
  };

  const stopCamera = () => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (attachRetryRef.current) {
      clearInterval(attachRetryRef.current);
      attachRetryRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch(e) { /* ignore */ }
    }
    lastScannedRef.current = '';
    setScanMode('menu');
  };

  // Ensure we stop camera when component unmounts and clear polls
  useEffect(() => {
    return () => {
      stopCamera();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // Monitor video events and update debug info when modal is open
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const updateInfo = () => {
      setVideoInfo({
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
        tracks: streamRef.current?.getTracks?.().length || 0,
        playing: !video.paused && !video.ended && video.readyState > 2,
        srcObject: !!video.srcObject
      });
    };

    const onPlaying = () => updateInfo();
    const onPause = () => updateInfo();
    const onError = (e) => { console.error('Video error event', e); updateInfo(); };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('play', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    // Poll while modal open to reflect size/ready changes
    if (!pollRef.current) {
      pollRef.current = setInterval(updateInfo, 500);
    }

    // If the modal just opened and we have a stream but srcObject wasn't attached, attach it now
    if (scanMode === 'camera' && streamRef.current && !video.srcObject) {
      try {
        video.srcObject = streamRef.current;
        console.log('Attached stream to video element from useEffect fallback');
        updateInfo();
        // attempt play as well
        video.play().then(() => { updateInfo(); }).catch(e => console.warn('Fallback play failed', e));
      } catch (e) {
        console.warn('Fallback attach failed', e);
      }
    }

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('play', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [scanMode]);

  // Auto-ensure camera stream when modal opens (tries getUserMedia / attach / play)
  useEffect(() => {
    if (scanMode === 'camera') {
      ensureCameraStream();
    } else {
      // If modal closed, clear any pending auto retries
      if (attachRetryRef.current) { clearInterval(attachRetryRef.current); attachRetryRef.current = null; }
    }
  }, [scanMode]);

  // Process image file
  const processImageFile = async (file) => {
    try {
      setLoading(true);
      showMessage('Processing image...', 'info');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = decodeQRCode(imageData, canvas.width, canvas.height);

          if (qrCode) {
            showMessage('QR code found!', 'success');
            await handleQrScan(qrCode);
          } else {
            showMessage('No QR code detected. Try another image.', 'error');
          }
          setLoading(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File processing error:', err);
      showMessage('Error processing file', 'error');
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file', 'error');
        return;
      }
      processImageFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      showMessage('Please enter QR code data', 'error');
      return;
    }
    setLoading(true);
    try {
      await handleQrScan(manualInput.trim());
      setManualInput('');
    } finally {
      setLoading(false);
    }
  };

  const handleQrScan = async (qrData) => {
    try {
      if (!user?.uid) {
        showMessage('User not authenticated. Please log in.', 'error');
        return;
      }

      const [eventId, sessionToken] = qrData.split(':');
      if (!eventId || !sessionToken) {
        showMessage('Invalid format. Expected: eventId:sessionToken', 'error');
        return;
      }

      // Fetch event
      const eventSnap = await getDoc(doc(db, 'events', eventId));
      if (!eventSnap.exists()) {
        showMessage('Event not found.', 'error');
        return;
      }

      const eventData = eventSnap.data();

      // Validate
      if (eventData.sessionToken !== sessionToken) {
        showMessage('Invalid QR code.', 'error');
        return;
      }
      if (eventData.status !== 'active') {
        showMessage('Event not accepting attendance.', 'error');
        return;
      }

      const now = new Date();
      const endTime = eventData.endTime?.toDate?.() || new Date(eventData.endTime);
      if (now > new Date(endTime.getTime() + 60 * 60 * 1000)) {
        showMessage('Event has ended.', 'error');
        return;
      }

      // Check duplicate
      try {
        const existingDocs = await getDocs(
          query(
            collection(db, 'attendance'),
            where('eventId', '==', eventId),
            where('studentId', '==', user.uid)
          )
        );
        if (!existingDocs.empty) {
          showMessage('You already scanned for this event.', 'info');
          return;
        }
      } catch (err) {
        showMessage('Database index pending. Try again in 1-2 min.', 'error');
        return;
      }

      // Get student
      const studentSnap = await getDoc(doc(db, 'students', user.uid));
      if (!studentSnap.exists()) {
        showMessage('Student profile not found. Complete registration.', 'error');
        return;
      }

      const startTime = eventData.startTime?.toDate?.() || new Date(eventData.startTime);
      const isLate = now > startTime;

      // Record attendance
      await addDoc(collection(db, 'attendance'), {
        eventId,
        studentId: user.uid,
        email: user.email,
        studentName: studentSnap.data().fullName || user.email,
        scannedAt: Timestamp.now(),
        checkInTime: Timestamp.fromDate(startTime),
        deviceInfo: navigator.userAgent,
        status: isLate ? 'late' : 'present',
        duration: Math.round((now - startTime) / 1000)
      });

      showMessage('✓ Attendance recorded!', 'success');
    } catch (err) {
      console.error('Scan error:', err);
      showMessage('Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Mark Attendance</h2>

      {message && (
        <div
          className={`p-4 rounded-lg mb-4 text-white text-sm ${
            messageType === 'success'
              ? 'bg-green-500'
              : messageType === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
        >
          {message}
        </div>
      )}

      {scanMode === 'menu' && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            📷 Use Camera
          </button>
        </div>
      )}

      {/* Camera Modal */}
      {scanMode === 'camera' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">📷 Scan QR Code</h3>
              <button
                onClick={stopCamera}
                className="text-white hover:bg-blue-700 rounded-full p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {message && (
                <div
                  className={`p-3 rounded-lg mb-4 text-sm text-white ${
                    messageType === 'success'
                      ? 'bg-green-500'
                      : messageType === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover bg-black"
                  autoPlay
                  playsInline
                  muted
                  aria-label="QR scanner video feed"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Scanning Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-green-500 rounded-lg opacity-70"></div>
                </div>

                {/* QR overlay (drawn when detection occurs) */}
                {qrCorners && canvasSize.w > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`} preserveAspectRatio="xMidYMid slice">
                    <polygon
                      points={qrCorners.map(p => `${p.x},${p.y}`).join(' ')}
                      stroke="#00FF00"
                      strokeWidth="8"
                      fill="rgba(0,255,0,0.15)"
                    />
                  </svg>
                )}

                {/* Scanning Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Scanning...
                </div>
              </div>

              {/* Show a short troubleshooting hint if stream isn't active */}
              {!streamRef.current && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                  ⚠️ Camera not started. Check your browser's camera permissions and allow access, then click Retry.
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 mb-4">
                <p className="font-semibold mb-1">💡 Tips:</p>
                <ul className="text-xs space-y-1">
                  <li>• Point camera at QR code</li>
                  <li>• Keep code centered in frame</li>
                  <li>• Ensure good lighting</li>
                  <li>• Code will scan automatically</li>
                </ul>
                <div className="mt-3 flex justify-between items-center">
                 
                  <span className="text-xs text-gray-500">Video: {videoInfo.width}x{videoInfo.height} • tracks: {videoInfo.tracks}</span>
                </div>
                {lastScanAttempt && (
                  <div className="mt-2 text-xs text-gray-600">Last attempt: {new Date(lastScanAttempt).toLocaleTimeString()}</div>
                )}
                {lastScanResult && (
                  <div className="mt-1 text-xs text-green-600">Last result: {lastScanResult}</div>
                )}

              </div>

              {debugMode && (
                <div className="bg-gray-900 text-white p-3 rounded mb-4 text-xs">
                  <pre className="whitespace-pre-wrap">{`readyState: ${videoInfo.readyState}\nplaying: ${videoInfo.playing}\ntracks: ${videoInfo.tracks}\nsrcObject: ${videoInfo.srcObject}\nstream present: ${!!streamRef.current}`}</pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 p-4 border-t flex gap-3">
              <button
                onClick={ensureCameraStream}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg"
              >
                Retry
              </button>
              <button
                onClick={stopCamera}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {scanMode === 'upload' && (
        <div className="space-y-3">
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700 cursor-pointer"
            />
          </label>
          <button
            onClick={() => setScanMode('menu')}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
          >
            Back
          </button>
        </div>
      )}

      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="eventId:sessionToken"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => setScanMode('menu')}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
          >
            Back
          </button>
        </form>
      )}

      {scanMode === 'menu' && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-gray-700 border border-blue-200">
          <p className="font-semibold mb-2">📋 How it works:</p>
          <ul className="space-y-1">
            <li>• <strong>Camera:</strong> Point at QR code, scan automatically</li>
            <li>• <strong>Image:</strong> Upload photo of QR code</li>
            <li>• <strong>Manual:</strong> Type code if needed</li>
          </ul>
        </div>
      )}

      {!user && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
          ⚠️ Please log in to mark attendance.
        </div>
      )}
    </div>
  );
}
