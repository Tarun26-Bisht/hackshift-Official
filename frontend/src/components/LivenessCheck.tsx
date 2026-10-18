"use client";
import { useEffect, useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const {
    videoRef,
    canvasRef,
    modelsLoaded,
    cameraActive,
    detection,
    error: cameraError,
    startCamera,
    stopCamera,
    startDetection,
    capturePhoto,
  } = useFaceDetection();

  const [challenge] = useState<typeof CHALLENGES[0]>(() => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
  const [phase, setPhase] = useState<'idle' | 'camera' | 'detecting' | 'passed' | 'failed'>('idle');
  const [countdown, setCountdown] = useState(20);
  const [capturedPhoto, setCapturedPhoto] = useState('');

  // Upload fallback state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start detection once camera is active
  useEffect(() => {
    if (cameraActive && phase === 'camera') {
      setPhase('detecting');
      startDetection(challenge.key);
      setCountdown(20);
    }
  }, [cameraActive, phase, challenge.key, startDetection]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'detecting') return;
    if (countdown <= 0) {
      setPhase('failed');
      stopCamera();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase, stopCamera]);

  // Challenge passed automatically by AI
  useEffect(() => {
    if (phase === 'detecting' && detection.challengePassed) {
      const photo = capturePhoto();
      if (photo) {
        setCapturedPhoto(photo);
        setPhase('passed');
        stopCamera();
      }
    }
  }, [detection.challengePassed, phase, capturePhoto, stopCamera]);

  const handleStart = async () => {
    setPhase('camera');
    await startCamera();
  };

  const handleManualCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCapturedPhoto(photo);
      setPhase('passed');
      stopCamera();
    }
  };

  const handleRetry = () => {
    setCapturedPhoto('');
    setPhase('idle');
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onVerified(capturedPhoto, challenge.key);
    }
  };

  // Upload selfie fallback handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size should be under 8MB.');
      return;
    }

    setUploadError('');
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
    if (uploadedPreview) {
      onVerified(uploadedPreview, 'passport_photo_upload');
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-full max-w-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab('camera');
            setUploadError('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎥 Live Web Camera
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            if (cameraActive) stopCamera();
            setPhase('idle');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📁 Upload Photo / Selfie
        </button>
      </div>

      {activeTab === 'camera' ? (
        <>
          {/* Challenge Banner */}
          <div className="w-full bg-blue-50 border border-blue-200/70 rounded-2xl p-4 text-center">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">
              AI Liveness Challenge
            </p>
            <p className="text-3xl mb-1">{challenge.emoji}</p>
            <p className="text-base font-black text-blue-900">{challenge.instruction}</p>
            <p className="text-xs text-blue-600 mt-1">
              {detection.expression ? `Current state: ${detection.expression}` : "Look at your camera to verify your identity"}
            </p>
          </div>

          {/* Camera Frame */}
          <div className="relative w-full max-w-sm aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-200 shadow-inner">
            {phase === 'idle' && (
              <div className="text-center text-gray-400 p-6">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm font-semibold text-gray-200">Camera preview will appear here</p>
                <p className="text-xs text-gray-400 mt-1">Click Start Camera below to begin verification</p>
              </div>
            )}

            <video
              ref={videoRef}
              className={`w-full h-full object-cover scale-x-[-1] ${
                phase === 'passed' || phase === 'idle' ? 'hidden' : ''
              }`}
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {capturedPhoto && phase === 'passed' && (
              <img src={capturedPhoto} alt="captured" className="w-full h-full object-cover scale-x-[-1]" />
            )}

            {/* Overlay indicators */}
            {phase === 'detecting' && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    detection.faceDetected ? 'bg-emerald-400' : 'bg-rose-400'
                  } animate-pulse`}
                />
                <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {countdown}s
                </span>
              </div>
            )}

            {phase === 'detecting' && (
              <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                  detection.faceDetected
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-black/70 text-gray-200'
                }`}
              >
                {detection.faceDetected ? `Face Detected ✓ ${challenge.label}` : 'Align face in camera'}
              </div>
            )}

            {phase === 'passed' && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                <div className="bg-emerald-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-lg">
                  ✓
                </div>
              </div>
            )}

            {phase === 'failed' && (
              <div className="absolute inset-0 bg-rose-900/60 flex items-center justify-center p-4">
                <div className="text-center text-white">
                  <p className="text-3xl mb-2">⏱️</p>
                  <p className="text-sm font-bold">Detection timed out</p>
                  <p className="text-xs text-rose-200 mt-1">
                    You can try again or use the "Capture Selfie Now" button below!
                  </p>
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-xl text-center max-w-sm">
              {cameraError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {phase === 'idle' && (
              <button
                type="button"
                onClick={handleStart}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm"
              >
                Start Camera & Verify
              </button>
            )}

            {(phase === 'detecting' || phase === 'camera') && (
              <button
                type="button"
                onClick={handleManualCapture}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
              >
                <span>📸</span>
                <span>Capture Selfie Now</span>
              </button>
            )}

            {phase === 'failed' && (
              <button
                type="button"
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
            )}

            {phase === 'passed' && (
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm"
                >
                  ✓ Use This Photo
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Upload Photo Fallback Tab */
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Passport Photo / Selfie Upload
            </p>
            <p className="text-xs text-slate-500">
              Upload a clear, front-facing passport-style photo or selfie from your computer or phone.
            </p>
          </div>

          <div className="w-full aspect-4/3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {uploadedPreview ? (
              <img
                src={uploadedPreview}
                alt="Selected photo"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-center flex flex-col items-center justify-center p-4 hover:opacity-80 transition-opacity"
              >
                <span className="text-4xl mb-2">📁</span>
                <p className="text-xs font-bold text-gray-700">Click to Choose Photo</p>
                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, or WEBP (Max 8MB)</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploadedPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              🔄 Change Photo
            </button>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg text-center w-full">
              {uploadError}
            </div>
          )}

          <button
            type="button"
            disabled={!uploadedPreview}
            onClick={handleConfirmUpload}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm"
          >
            ✓ Submit Photo & Continue
          </button>
        </div>
      )}
    </div>
  );
}
