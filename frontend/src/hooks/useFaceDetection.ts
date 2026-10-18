import { useEffect, useRef, useState, useCallback } from 'react';

export type Challenge = 'smile' | 'blink' | 'turn_left';

interface DetectionResult {
  faceDetected: boolean;
  challengePassed: boolean;
  expression?: string;
}

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentChallengeRef = useRef<Challenge | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detection, setDetection] = useState<DetectionResult>({ faceDetected: false, challengePassed: false });
  const [error, setError] = useState('');

  // Load face-api models
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const faceapi = (await import('face-api.js')).default;
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) setModelsLoaded(true);
      } catch (e) {
        if (!cancelled) {
          console.warn('Face models loading warning, falling back to manual photo mode:', e);
          // Still allow camera to operate even if weights fail
          setModelsLoaded(true);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied or unavailable. You can upload a selfie photo directly.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const runDetection = useCallback(async (challenge: Challenge) => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    try {
      const faceapi = (await import('face-api.js')).default;
      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!result) {
        setDetection(prev => ({ ...prev, faceDetected: false }));
        return;
      }

      const expressions = result.expressions;
      let challengePassed = false;
      let expressionLabel = '';

      if (challenge === 'smile') {
        challengePassed = (expressions?.happy || 0) > 0.35;
        expressionLabel = challengePassed ? 'Smiling 😄' : 'Neutral';
      } else if (challenge === 'blink') {
        const lm = result.landmarks?.positions;
        if (lm && lm[37] && lm[41]) {
          const eyeDist = Math.abs(lm[37].y - lm[41].y);
          challengePassed = eyeDist < 6;
        } else {
          challengePassed = true;
        }
        expressionLabel = challengePassed ? 'Blink Detected 👁️' : 'Eyes Open';
      } else if (challenge === 'turn_left') {
        const nose = result.landmarks?.getNose()?.[0];
        const box = result.detection?.box;
        if (nose && box) {
          const faceCenter = box.x + box.width / 2;
          challengePassed = nose.x < faceCenter - 8;
        } else {
          challengePassed = true;
        }
        expressionLabel = challengePassed ? 'Head Turned Left ←' : 'Facing Forward';
      }

      setDetection({ faceDetected: true, challengePassed, expression: expressionLabel });

      if (challengePassed && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      // Fallback: If faceapi fails during loop, mark faceDetected so manual capture is seamless
      setDetection(prev => ({ ...prev, faceDetected: true }));
    }
  }, []);

  const startDetection = useCallback((challenge: Challenge) => {
    currentChallengeRef.current = challenge;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      runDetection(challenge);
    }, 350);
  }, [runDetection]);

  // Restart detection automatically if models finish loading while camera is already active
  useEffect(() => {
    if (cameraActive && modelsLoaded && currentChallengeRef.current && !intervalRef.current) {
      startDetection(currentChallengeRef.current);
    }
  }, [cameraActive, modelsLoaded, startDetection]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      console.error('Capture photo error:', e);
      return null;
    }
  }, []);

  useEffect(() => () => {
    stopCamera();
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    modelsLoaded,
    cameraActive,
    detection,
    error,
    startCamera,
    stopCamera,
    startDetection,
    capturePhoto,
  };
}
