"use client";
import { useEffect, useState } from 'react';
import { useFaceDetection, type Challenge } from '@/hooks/useFaceDetection';

const CHALLENGES: { key: Challenge; label: string; instruction: string; emoji: string }[] = [
  { key: 'smile', label: 'Smile', instruction: 'Give us a big smile 😄', emoji: '😄' },
  { key: 'blink', label: 'Blink', instruction: 'Blink both eyes slowly 👁️', emoji: '👁️' },
  { key: 'turn_left', label: 'Turn Left', instruction: 'Turn your head slightly to the left ←', emoji: '←' },
];

interface Props {
  onVerified: (photoDataUrl: string, challenge: string) => void;
}

export default function LivenessCheck({ onVerified }: Props) {
  const { videoRef, canvasRef, modelsLoaded, cameraActive, detection, error, startCamera, stopCamera, startDetection, capturePhoto } = useFaceDetection();
  const [challenge] = useState<typeof CHALLENGES[0]>(() => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
  const [phase, setPhase] = useState<'idle' | 'camera' | 'detecting' | 'passed' | 'failed'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState('');

  // Start detection once camera is active
  useEffect(() => {
    if (cameraActive && phase === 'camera') {
      setPhase('detecting');
      startDetection(challenge.key);
      setCountdown(15);
    }
  }, [cameraActive]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'detecting') return;
    if (countdown <= 0) { setPhase('failed'); stopCamera(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  // Challenge passed
  useEffect(() => {
    if (phase === 'detecting' && detection.challengePassed) {
      const photo = capturePhoto();
      if (photo) {
        setCapturedPhoto(photo);
        setPhase('passed');
        stopCamera();
      }
    }
  }, [detection.challengePassed, phase]);

  const handleStart = async () => {
    setPhase('camera');
    await startCamera();
  };

  const handleRetry = () => {
    setCapturedPhoto('');
    setPhase('idle');
  };

  const handleConfirm = () => {
    if (capturedPhoto) onVerified(capturedPhoto, challenge.key);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Challenge Card */}
      <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
        <p className="text-xs font-semibold text-blue-400 uppercase mb-1">Your Challenge</p>
        <p className="text-2xl mb-1">{challenge.emoji}</p>
        <p className="text-base font-bold text-blue-800">{challenge.instruction}</p>
        <p className="text-xs text-blue-400 mt-1">This proves you're a real person, not a robot.</p>
      </div>

      {/* Camera / Result Area */}
      <div className="relative w-full max-w-sm aspect-video bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
        {phase === 'idle' && (
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm">Camera will open here</p>
          </div>
        )}

        <video ref={videoRef} className={`w-full h-full object-cover ${phase === 'passed' || phase === 'idle' ? 'hidden' : ''}`} muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {capturedPhoto && phase === 'passed' && (
          <img src={capturedPhoto} alt="captured" className="w-full h-full object-cover" />
        )}

        {/* Overlay indicators */}
        {phase === 'detecting' && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${detection.faceDetected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded-full">{countdown}s</span>
          </div>
        )}

        {phase === 'detecting' && (
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            detection.faceDetected ? 'bg-green-500/90 text-white' : 'bg-black/60 text-gray-300'
          }`}>
            {detection.faceDetected ? `Face detected — ${challenge.instruction}` : 'Position your face in frame'}
          </div>
        )}

        {phase === 'passed' && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-lg">✓</div>
          </div>
        )}

        {phase === 'failed' && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-3xl mb-2">⏱️</p>
              <p className="text-sm font-semibold">Time's up</p>
            </div>
          </div>
        )}

        {!modelsLoaded && phase !== 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p className="text-xs">Loading AI models...</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Action Buttons */}
      <div className="flex gap-3 w-full">
        {phase === 'idle' && (
          <button onClick={handleStart} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Start Camera & Verify
          </button>
        )}
        {(phase === 'failed') && (
          <button onClick={handleRetry} className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors">
            Try Again
          </button>
        )}
        {phase === 'passed' && (
          <>
            <button onClick={handleRetry} className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50">
              Retake
            </button>
            <button onClick={handleConfirm} className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors">
              ✓ Use This Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
