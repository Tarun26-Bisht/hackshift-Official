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
        if (!cancelled) setError('Failed to load face detection models.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setError('Camera access denied. Please allow camera permission.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCameraActive(false);
  }, []);

  const startDetection = useCallback((challenge: Challenge) => {
    if (!modelsLoaded || !videoRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const faceapi = (await import('face-api.js')).default;
        const result = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!result) {
          setDetection({ faceDetected: false, challengePassed: false });
          return;
        }

        const expressions = result.expressions;
        let challengePassed = false;
        let expressionLabel = '';

        if (challenge === 'smile') {
          challengePassed = expressions.happy > 0.7;
          expressionLabel = 'happy';
        } else if (challenge === 'blink') {
          // Detect blink via eye landmark distance
          const lm = result.landmarks.positions;
          const leftEyeTop = lm[37];
          const leftEyeBottom = lm[41];
          const eyeOpenness = Math.abs(leftEyeTop.y - leftEyeBottom.y);
          challengePassed = eyeOpenness < 4;
          expressionLabel = 'blink';
        } else if (challenge === 'turn_left') {
          // Nose tip vs face center — if nose is left of center, head turned left
          const nose = result.landmarks.getNose()[0];
          const box = result.detection.box;
          const faceCenter = box.x + box.width / 2;
          challengePassed = nose.x < faceCenter - 15;
          expressionLabel = 'turn_left';
        }

        setDetection({ faceDetected: true, challengePassed, expression: expressionLabel });

        if (challengePassed) clearInterval(intervalRef.current!);
      } catch { /* silent */ }
    }, 300);
  }, [modelsLoaded]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  useEffect(() => () => {
    stopCamera();
  }, [stopCamera]);

  return { videoRef, canvasRef, modelsLoaded, cameraActive, detection, error, startCamera, stopCamera, startDetection, capturePhoto };
}
