import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  SwitchCamera,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { CaptureTemplate, ShotDefinition } from '@/types/template';
import { BodyStyle } from '@/types/vehicle';
import { CapturedShot, QualityMetric } from '@/types/capture';
import { VehicleSilhouette } from './overlays/vehicleSilhouettes';
import { OverlayControls, OverlaySettings } from './overlays/OverlayControls';
import { QualityWarningBanner } from './QualityWarningBanner';
import { analyzeImageQuality } from '@/services/camera/qualityEngine';

interface SmartCameraViewProps {
  template: CaptureTemplate;
  bodyStyle: BodyStyle;
  initialShotIndex?: number;
  existingShots?: CapturedShot[];
  onCaptureShot: (shot: CapturedShot) => void;
  onFinishSession: () => void;
  onClose: () => void;
}

export const SmartCameraView: React.FC<SmartCameraViewProps> = ({
  template,
  bodyStyle,
  initialShotIndex = 0,
  existingShots: _existingShots = [],
  onCaptureShot,
  onFinishSession,
  onClose,
}) => {
  const [currentShotIndex, setCurrentShotIndex] = useState(initialShotIndex);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Review mode state (after taking shot)
  const [previewCapturedDataUrl, setPreviewCapturedDataUrl] = useState<string | null>(null);
  const [lastQuality, setLastQuality] = useState<QualityMetric | null>(null);
  const [pendingShot, setPendingShot] = useState<CapturedShot | null>(null);

  // Device orientation / Horizon level
  const [tiltDegrees, setTiltDegrees] = useState<number>(0);

  // Overlay HUD settings
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    isVisible: true,
    opacity: 0.6,
    color: '#06B6D4', // Cyan default
    showHorizon: true,
    showGrid: false,
    scale: 1.0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const currentShot: ShotDefinition = template.shots[currentShotIndex] || template.shots[0];
  const totalShots = template.shots.length;

  // 1. Initialize DeviceOrientation sensor
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left-to-right tilt in degrees (-90 to 90)
      if (e.gamma !== null) {
        setTiltDegrees(e.gamma);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 2. Initialize Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 2560 }, // Request high-resolution capture
          height: { ideal: 1440 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Check torch capability
      const capabilities = track.getCapabilities
        ? (track.getCapabilities() as Record<string, unknown>)
        : {};
      if (capabilities && 'torch' in capabilities) {
        setHasTorchCapability(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Real camera stream failed, entering mock/simulator mode:', err);
      setIsCameraActive(false);
      setCameraError(
        'Physical camera access was denied or unavailable. Simulator preview mode is active for testing.'
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!trackRef.current || !hasTorchCapability) return;
    try {
      const nextTorch = !isTorchOn;
      // @ts-expect-error Torch constraints
      await trackRef.current.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Switch between Rear and Front cameras
  const switchCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 3. Shutter Capture Handler
  const handleShutterCapture = () => {
    const canvas = document.createElement('canvas');
    let width = 2048;
    let height = 1536;

    if (isCameraActive && videoRef.current && videoRef.current.videoWidth) {
      width = videoRef.current.videoWidth;
      height = videoRef.current.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      }
    } else {
      // Mock / fallback generator for desktop / CI testing
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Render sleek simulated automotive scene
        ctx.fillStyle = '#161A23';
        ctx.fillRect(0, 0, width, height);

        // Ground asphalt
        ctx.fillStyle = '#0B0D11';
        ctx.fillRect(0, height * 0.65, width, height * 0.35);

        // Synthetic vehicle silhouette box
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 4;
        ctx.strokeRect(width * 0.2, height * 0.3, width * 0.6, height * 0.4);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SIMULATED CAPTURE: ${currentShot.name}`, width / 2, height / 2);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(
          `Body: ${bodyStyle.toUpperCase()} • Time: ${new Date().toLocaleTimeString()}`,
          width / 2,
          height / 2 + 50
        );
      }
    }

    // Quality Analysis
    const quality = analyzeImageQuality(canvas, tiltDegrees);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const shotRecord: CapturedShot = {
      shotId: `shot-${Date.now()}`,
      shotCode: currentShot.code,
      shotName: currentShot.name,
      sequenceOrder: currentShot.order,
      imageDataUrl: dataUrl,
      capturedAt: new Date().toISOString(),
      isHero: currentShot.isHero,
      retakeCount: 0,
      quality,
      syncStatus: 'local',
    };

    setPreviewCapturedDataUrl(dataUrl);
    setLastQuality(quality);
    setPendingShot(shotRecord);
  };

  // Commit shot to session
  const commitShot = () => {
    if (!pendingShot) return;
    onCaptureShot(pendingShot);
    setPreviewCapturedDataUrl(null);
    setLastQuality(null);
    setPendingShot(null);

    // Advance to next shot if available
    if (currentShotIndex < totalShots - 1) {
      setCurrentShotIndex((prev) => prev + 1);
    }
  };

  // Retake current shot
  const retakeShot = () => {
    setPreviewCapturedDataUrl(null);
    setLastQuality(null);
    setPendingShot(null);
  };

  const isLevel = Math.abs(tiltDegrees) <= 2.5;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden touch-none">
      {/* 1. TOP HEADER HUD */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-[11px] font-mono tracking-wider uppercase text-brand-cyan">
            Shot {currentShotIndex + 1} of {totalShots}
            {currentShot.isHero && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-amber/20 text-brand-amber text-[10px] font-bold">
                HERO
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-[220px]">
            {currentShot.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {hasTorchCapability && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                isTorchOn ? 'bg-brand-amber text-charcoal-950' : 'bg-black/40 text-white'
              }`}
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CAMERA VIEWFINDER & HUD OVERLAYS */}
      <div className="relative flex-1 bg-charcoal-950 flex items-center justify-center overflow-hidden">
        {/* Live Video Preview */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
        />

        {/* Fallback Simulator Screen if camera is blocked / desktop test */}
        {!isCameraActive && (
          <div className="absolute inset-0 bg-charcoal-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-brand-cyan mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-white">Camera Simulator Active</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {cameraError || 'Operating in mock camera preview mode. Ready to capture test frame.'}
            </p>
          </div>
        )}

        {/* Captured Preview Freeze Frame (When reviewing shot) */}
        {previewCapturedDataUrl && (
          <img
            src={previewCapturedDataUrl}
            alt="Captured Preview"
            className="absolute inset-0 w-full h-full object-cover z-20"
          />
        )}

        {/* Rule-of-Thirds Grid */}
        {overlaySettings.showGrid && !previewCapturedDataUrl && (
          <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>
        )}

        {/* VEHICLE GUIDED SILHOUETTE OVERLAY */}
        {overlaySettings.isVisible && !previewCapturedDataUrl && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-4 transition-transform duration-150"
            style={{
              opacity: overlaySettings.opacity,
              transform: `scale(${overlaySettings.scale})`,
            }}
          >
            <VehicleSilhouette
              bodyStyle={bodyStyle}
              shotCode={currentShot.code}
              color={overlaySettings.color}
            />
          </div>
        )}

        {/* Horizon Level Indicator */}
        {overlaySettings.showHorizon && !previewCapturedDataUrl && (
          <div className="absolute inset-x-8 top-1/2 z-10 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <div
              className={`h-0.5 w-full max-w-xs rounded transition-all duration-100 ${
                isLevel ? 'bg-hud-green shadow-[0_0_8px_#22C55E]' : 'bg-white/40'
              }`}
              style={{
                transform: `rotate(${Math.min(25, Math.max(-25, tiltDegrees))}deg)`,
              }}
            />
            {isLevel && (
              <span className="absolute -top-6 text-[10px] font-mono font-bold tracking-wider text-hud-green bg-black/60 px-2 py-0.5 rounded-full border border-hud-green/40">
                LEVEL
              </span>
            )}
          </div>
        )}

        {/* Quality Warning Banner Overlay */}
        {lastQuality && previewCapturedDataUrl && (
          <QualityWarningBanner
            quality={lastQuality}
            onRetake={retakeShot}
            onKeepAnyway={commitShot}
          />
        )}

        {/* Overlay Controls Sheet */}
        <OverlayControls
          settings={overlaySettings}
          onChange={setOverlaySettings}
          isOpen={isControlsOpen}
          onClose={() => setIsControlsOpen(false)}
        />
      </div>

      {/* 3. GUIDANCE SUBTITLE */}
      <div className="relative z-20 px-6 py-2 bg-charcoal-950/90 text-center border-t border-charcoal-850">
        <p className="text-xs text-slate-300 font-medium tracking-wide">
          {currentShot.guidanceText}
        </p>
      </div>

      {/* 4. BOTTOM ACTION & SHUTTER CONTROLS */}
      <div className="relative z-30 px-6 py-4 bg-black flex items-center justify-between border-t border-white/10">
        {previewCapturedDataUrl ? (
          /* Review Action Bar */
          <div className="w-full flex items-center justify-between gap-4">
            <button
              onClick={retakeShot}
              className="flex-1 py-3 px-4 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-brand-amber" />
              Retake
            </button>
            <button
              onClick={commitShot}
              className="flex-1 py-3 px-4 rounded-2xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-sm flex items-center justify-center gap-2 shadow-glow-cyan active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              Keep Photo
            </button>
          </div>
        ) : (
          /* Live Camera Shutter & Navigation */
          <>
            {/* Previous Shot Button */}
            <button
              disabled={currentShotIndex === 0}
              onClick={() => setCurrentShotIndex((p) => Math.max(0, p - 1))}
              className="p-3 rounded-full bg-charcoal-900 border border-charcoal-700 text-slate-300 disabled:opacity-30 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Shutter Button */}
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleShutterCapture}
                aria-label="Capture vehicle photo"
                className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform shadow-2xl focus:outline-none"
              >
                <div className="w-14 h-14 rounded-full bg-white hover:bg-slate-200 transition-colors shadow-inner" />
              </button>
            </div>

            {/* Next / Switch Camera / Finish Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={switchCameraFacing}
                className="p-3 rounded-full bg-charcoal-900 border border-charcoal-700 text-slate-300 active:scale-95 transition-all"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {currentShotIndex < totalShots - 1 ? (
                <button
                  onClick={() => setCurrentShotIndex((p) => Math.min(totalShots - 1, p + 1))}
                  className="p-3 rounded-full bg-charcoal-900 border border-charcoal-700 text-slate-300 active:scale-95 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onFinishSession}
                  className="px-3 py-2 rounded-xl bg-brand-emerald text-charcoal-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-glow-emerald"
                >
                  Finish
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
