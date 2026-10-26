import { referenceGeometry } from '@/services/references/geometry';
import { DEFAULT_OVERLAY } from './overlays/defaultSettings';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  X,
  SwitchCamera,
  Zap,
} from 'lucide-react';
import { CaptureTemplate } from '@/types/template';
import { BodyStyle } from '@/types/vehicle';
import { CapturedShot, PhotographyStandard } from '@/types/capture';
import { OverlayControls, OverlaySettings } from './overlays/OverlayControls';
import { ReferenceOverlay } from './overlays/ReferenceOverlay';
import { ReferenceStudio } from './ReferenceStudio';
import {
  ReferenceAsset,
  referenceAsset,
  compositionGuide,
  EXTERIOR_ANGLES,
} from '@/services/references/assets';
import { getApprovedReference } from '@/services/references/custom';
import { CameraController, CameraCapabilities } from '@/services/camera/controller';
import {
  captureFrame,
  canvasBlob,
  screenRoll,
  AspectRatio,
  coverCrop,
} from '@/services/camera/geometry';
import { analyzeImageQuality } from '@/services/camera/qualityEngine';
import { getSetting, putSetting, storageError } from '@/services/storage/indexedDb';
import { nextMissing } from '@/services/capture/sequence';
import { DEFAULT_STANDARD } from '@/services/standards';
import { CocoVehicleDetector, alignment, VehicleDetection } from '@/services/camera/detector';
interface Props {
  template: CaptureTemplate;
  bodyStyle: BodyStyle;
  dealershipId?: string;
  standard?: PhotographyStandard;
  initialShotIndex?: number;
  existingShots?: CapturedShot[];
  onCaptureShot: (s: CapturedShot) => Promise<void> | void;
  onFinishSession: () => Promise<void> | void;
  onClose: () => Promise<void> | void;
}
export function SmartCameraView({
  template,
  bodyStyle,
  dealershipId = 'default',
  standard = DEFAULT_STANDARD,
  initialShotIndex = 0,
  existingShots = [],
  onCaptureShot,
  onFinishSession,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialShotIndex),
    [ratio, setRatio] = useState<AspectRatio>(template.aspectRatio),
    [sample, setSample] = useState(false),
    [active, setActive] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<CapturedShot | null>(null),
    [open, setOpen] = useState(false),
    [settings, setSettings] = useState<OverlaySettings>({ ...DEFAULT_OVERLAY }),
    [tilt, setTilt] = useState<number | null>(null),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [deviceId, setDeviceId] = useState(''),
    [facing, setFacing] = useState('environment'),
    [caps, setCaps] = useState<CameraCapabilities>({}),
    [zoom, setZoom] = useState(1),
    [exposure, setExposure] = useState(0),
    [torch, setTorch] = useState(false),
    [resolution, setResolution] = useState(''),
    [reference, setReference] = useState<ReferenceAsset | null>(null),
    [refRevision, setRefRevision] = useState(0),
    [cv, setCv] = useState(false),
    [cvStatus, setCvStatus] = useState('Manual alignment'),
    [detection, setDetection] = useState<VehicleDetection | null>(null),
    [focusPoint, setFocusPoint] = useState<[number, number] | null>(null),
    [retry, setRetry] = useState(0);
  const video = useRef<HTMLVideoElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    controller = useRef(new CameraController()),
    lock = useRef(false),
    sampleImage = useRef<HTMLImageElement | null>(null);
  const shot = template.shots[index] || template.shots[0];
  const key = `calibration:${dealershipId}:${bodyStyle}:${shot.code}`;
  useEffect(() => {
    let live = true;
    let url: string | undefined;
    setSettings({ ...DEFAULT_OVERLAY });
    setReference(referenceAsset(bodyStyle, shot.code));
    getSetting<OverlaySettings>(key)
      .then((s) => {
        if (live && s) setSettings(s);
      })
      .catch(() => setError('Saved calibration could not be read.'));
    getApprovedReference(dealershipId, bodyStyle, shot.code)
      .then((r) => {
        if (!live || !r) return;
        url = URL.createObjectURL(r.cutout);
        setReference({
          id: r.id,
          url,
          rect: [0, 0, r.width, r.height],
          mirror: false,
          label: 'Dealership approved reference',
          imageWidth: r.width,
          imageHeight: r.height,
        });
      })
      .catch(() => setError('Approved reference could not be read.'));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, bodyStyle, shot.code, dealershipId, refRevision]);
  const cameraGeneration = useRef(0);
  const start = useCallback(async () => {
    const generation = ++cameraGeneration.current;
    setActive(false);
    setTorch(false);
    setCaps({});
    setError('');
    try {
      const stream = await controller.current.start(deviceId || undefined, facing);
      if (!stream) return;
      if (video.current) {
        video.current.srcObject = stream;
        await video.current.play();
      }
      if (generation !== cameraGeneration.current) return;
      setCaps(controller.current.capabilities);
      const d = await navigator.mediaDevices.enumerateDevices();
      setDevices(d.filter((x) => x.kind === 'videoinput'));
      if (generation !== cameraGeneration.current) return;
      setActive(true);
    } catch (e) {
      if (generation !== cameraGeneration.current) return;
      setError(
        `Camera unavailable. Allow camera access in browser settings, then retry. ${e instanceof Error ? e.message : ''}`
      );
    }
  }, [deviceId, facing]);
  useEffect(() => {
    const c = controller.current;
    const generationRef = cameraGeneration;
    if (!sample) void start();
    else {
      cameraGeneration.current++;
      c.stop();
      setActive(false);
      setError('');
    }
    const visibility = () => {
      setTilt(null);
      setDetection(null);
      if (document.hidden) {
        c.stop();
        setActive(false);
        setTorch(false);
      } else if (!sample) void start();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      generationRef.current++;
      c.stop();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [start, sample, retry]);
  useEffect(() => {
    const track = controller.current.track;
    if (!active || !track) return;
    const ended = () => {
      setActive(false);
      setError('Camera stream interrupted. Retry camera to continue.');
    };
    track.addEventListener('ended', ended);
    return () => track.removeEventListener('ended', ended);
  }, [active]);
  useEffect(() => {
    let last = 0;
    const handle = (e: DeviceOrientationEvent) => {
      last = Date.now();
      setTilt(screenRoll(e.beta, e.gamma, screen.orientation?.angle || 0));
    };
    const reset = () => setTilt(null);
    const timer = setInterval(() => {
      if (Date.now() - last > 2500) setTilt(null);
    }, 1000);
    window.addEventListener('deviceorientation', handle);
    screen.orientation?.addEventListener('change', reset);
    return () => {
      clearInterval(timer);
      window.removeEventListener('deviceorientation', handle);
      screen.orientation?.removeEventListener('change', reset);
    };
  }, []);
  useEffect(() => {
    if (!reference) return;
    let live = true;
    const img = new Image();
    img.src = reference.url;
    img.onload = () => {
      if (live) sampleImage.current = img;
    };
    img.onerror = () => {
      if (live) {
        setReference(null);
        sampleImage.current = null;
      }
    };
    return () => {
      live = false;
      sampleImage.current = null;
    };
  }, [reference]);
  useEffect(() => {
    const v = video.current;
    if (!active || !v?.videoWidth) return;
    const crop = coverCrop(v.videoWidth, v.videoHeight, ratio);
    setResolution(`${Math.floor(crop.width)} × ${Math.floor(crop.height)}`);
  }, [active, ratio]);
  useEffect(
    () => () => {
      if (pending?.imageDataUrl.startsWith('blob:')) URL.revokeObjectURL(pending.imageDataUrl);
    },
    [pending]
  );
  const target = referenceGeometry(reference, ratio, standard, settings).target;
  const result = alignment(detection, target, tilt);
  useEffect(() => {
    if (!cv || !active || sample || shot.category !== 'exterior') {
      setDetection(null);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const detector = new CocoVehicleDetector();
    setCvStatus('Loading optional detector…');
    (async () => {
      try {
        await detector.load();
        if (!alive) {
          detector.dispose();
          return;
        }
        const tick = async () => {
          if (!alive || document.hidden) return;
          try {
            if (video.current?.videoWidth) {
              const v = video.current;
              const crop = coverCrop(v.videoWidth, v.videoHeight, ratio);
              const small = document.createElement('canvas');
              small.width = 320;
              small.height = Math.round((320 * crop.height) / crop.width);
              small
                .getContext('2d')!
                .drawImage(
                  v,
                  crop.x,
                  crop.y,
                  crop.width,
                  crop.height,
                  0,
                  0,
                  small.width,
                  small.height
                );
              const d = await detector.detect(small);
              if (alive) {
                setDetection(d);
                const ms = detector.benchmark.inferenceMs.at(-1) || 0;
                setCvStatus(`Experimental • ${Math.round(ms)} ms / frame`);
              }
            }
          } catch {
            if (alive) {
              setDetection(null);
              setCvStatus('Detector failed — align manually');
            }
          }
          if (alive) timer = setTimeout(tick, 600);
        };
        await tick();
      } catch {
        if (alive) {
          setDetection(null);
          setCvStatus('Detector unavailable — align manually');
        }
      }
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
      detector.dispose();
    };
  }, [cv, active, sample, ratio, shot.category]);
  const constrain = async (values: Record<string, unknown>) => {
    try {
      await controller.current.constrain(values);
      return true;
    } catch (e) {
      setError(`Camera control unavailable: ${e instanceof Error ? e.message : ''}`);
      return false;
    }
  };
  const shutter = async () => {
    if (lock.current || (!active && !sample)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      let source: CanvasImageSource, width: number, height: number;
      if (sample) {
        const c = document.createElement('canvas');
        c.width = 1600;
        c.height = 1200;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#33383e';
        ctx.fillRect(0, 0, c.width, c.height);
        const img = sampleImage.current;
        if (img && reference) {
          const [sx, sy, sw, sh] = reference.rect;
          ctx.drawImage(img, sx, sy, sw, sh, 160, 220, 1280, 760);
        }
        ctx.fillStyle = 'white';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText('SAMPLE — NOT AN INVENTORY PHOTO', 50, 90);
        source = c;
        width = c.width;
        height = c.height;
      } else {
        if (!video.current?.videoWidth) throw new Error('Wait for the camera to provide a frame.');
        source = video.current;
        width = video.current.videoWidth;
        height = video.current.videoHeight;
      }
      const { canvas, crop } = captureFrame(source, width, height, ratio);
      const quality = analyzeImageQuality(canvas, sample ? null : tilt, {
        minWidth: standard.minWidth,
        minHeight: standard.minHeight,
      });
      if (sample) quality.warnings.unshift('Sample image. Never use as real vehicle media.');
      const blob = await canvasBlob(canvas);
      const camera = controller.current.track?.getSettings();
      const panelState =
        shot.code === 'ENGINE_BAY'
          ? { hood: 'open' as const }
          : shot.code === 'DRIVER_COCKPIT'
            ? { driverDoor: 'open' as const }
            : shot.code === 'TRUNK_CARGO'
              ? bodyStyle === 'truck'
                ? { tailgate: 'open' as const }
                : { trunk: 'open' as const }
              : undefined;
      setPending({
        shotId: crypto.randomUUID(),
        shotCode: shot.code,
        shotName: shot.name,
        sequenceOrder: shot.order,
        imageDataUrl: URL.createObjectURL(blob),
        rawBlob: blob,
        source: sample ? 'sample' : 'camera',
        capturedAt: new Date().toISOString(),
        isHero: shot.isHero,
        retakeCount: 0,
        quality,
        syncStatus: 'local',
        metadata: {
          category: shot.category,
          referenceAssetId: reference?.id,
          referenceCalibration: { ...settings },
          originalDimensions: { width, height },
          outputCrop: crop,
          orientation: screen.orientation?.angle || 0,
          camera: sample
            ? undefined
            : {
                label: controller.current.track?.label,
                facingMode: camera?.facingMode,
                width: camera?.width,
                height: camera?.height,
                zoom,
              },
          exteriorTargetAngle: EXTERIOR_ANGLES[shot.code],
          interiorSceneId: shot.category === 'interior' ? shot.code : undefined,
          panelState,
          alignment:
            !sample && result.available && detection
              ? {
                  score: result.score,
                  confidence: detection.confidence,
                  provider: 'coco-ssd-lite-mobilenet-v2',
                  centerDeviation: result.centerDeviation,
                  coverageDeviation: result.coverageDeviation,
                }
              : undefined,
        },
      });
      navigator.vibrate?.(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const keep = async () => {
    if (!pending || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      pending.quality.userApprovedWarning = pending.quality.warnings.length > 0;
      await onCaptureShot(pending);
      const captured = [...existingShots.filter((s) => s.shotCode !== pending.shotCode), pending];
      setPending(null);
      setIndex(nextMissing(template, captured, (index + 1) % template.shots.length));
      setError('');
    } catch (e) {
      setError(storageError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="camera-shell" data-testid="camera-studio">
      <header className="camera-header">
        <button
          aria-label="Pause and review gallery"
          onClick={() => {
            void Promise.resolve(onClose()).catch((e) => setError(storageError(e)));
          }}
          disabled={busy}
        >
          <X size={22} />
        </button>
        <div>
          <span className="eyebrow">
            {sample ? 'SAMPLE MODE' : 'GUIDED CAMERA'} · Shot {index + 1} of {template.shots.length}
          </span>
          <h1>{shot.name}</h1>
        </div>
        <button aria-label="Reference and camera settings" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={22} />
        </button>
      </header>
      <main className="camera-stage">
        <div
          ref={viewport}
          className="viewfinder"
          style={{ aspectRatio: ratio.replace(':', '/') }}
          onPointerDown={async (e) => {
            if (!active || pending) return;
            if (!caps.focusMode?.includes('single-shot') || !('pointsOfInterest' in caps)) return;
            const r = e.currentTarget.getBoundingClientRect();
            const p: [number, number] = [
              (e.clientX - r.left) / r.width,
              (e.clientY - r.top) / r.height,
            ];
            if (
              await constrain({
                focusMode: 'single-shot',
                pointsOfInterest: [
                  (() => {
                    const v = video.current!;
                    const crop = coverCrop(v.videoWidth, v.videoHeight, ratio);
                    return {
                      x: (crop.x + p[0] * crop.width) / v.videoWidth,
                      y: (crop.y + p[1] * crop.height) / v.videoHeight,
                    };
                  })(),
                ],
              })
            ) {
              setFocusPoint(p);
              setTimeout(() => setFocusPoint(null), 1000);
            }
          }}
        >
          <video
            ref={video}
            playsInline
            autoPlay
            muted
            className={`live-video ${active && !sample ? '' : 'invisible'}`}
            onLoadedMetadata={() => {
              if (video.current) {
                const { canvas } = captureFrame(
                  video.current,
                  video.current.videoWidth,
                  video.current.videoHeight,
                  ratio
                );
                setResolution(`${canvas.width} × ${canvas.height}`);
              }
            }}
          />
          {sample && (
            <div className="sample-scene">
              <span>SAMPLE · Camera is off</span>
            </div>
          )}
          {!active && !sample && (
            <div className="camera-unavailable">
              <Camera size={32} />
              <h2>Camera access needed</h2>
              <p>
                Allow rear-camera access or explore the workflow with clearly labeled sample images.
              </p>
              <button onClick={() => setRetry((n) => n + 1)}>Retry camera</button>
              <button onClick={() => setSample(true)}>Use sample-photo mode</button>
            </div>
          )}
          {!pending && (active || sample) && (
            <>
              {settings.showGrid && <div className="thirds-grid" />}
              {settings.isVisible && (
                <ReferenceOverlay
                  asset={reference}
                  shot={shot}
                  body={bodyStyle}
                  settings={settings}
                  ratio={ratio}
                  standard={standard}
                />
              )}
              <div className="frame-badge">
                {ratio} · {sample ? 'Sample reference' : resolution || 'Waiting for frame'}
              </div>
              {settings.showHorizon && (
                <div
                  className={`horizon ${tilt !== null && Math.abs(tilt) <= 2.5 ? 'level' : ''}`}
                  style={{ transform: `rotate(${tilt || 0}deg)` }}
                >
                  <span>
                    {tilt === null
                      ? 'Horizon sensor unavailable'
                      : Math.abs(tilt) <= 2.5
                        ? 'LEVEL'
                        : `${tilt.toFixed(1)}°`}
                  </span>
                </div>
              )}
              {focusPoint && (
                <div
                  className="focus-point"
                  style={{ left: `${focusPoint[0] * 100}%`, top: `${focusPoint[1] * 100}%` }}
                />
              )}
            </>
          )}
          {pending && (
            <img className="captured-preview" src={pending.imageDataUrl} alt="Captured Preview" />
          )}
        </div>
        {(active || sample) && !pending && (
          <div className="alignment-status">
            <span>
              {sample
                ? 'Manual alignment · sample'
                : cv && shot.category === 'exterior'
                  ? cvStatus
                  : 'Manual alignment · use reference landmarks'}
            </span>
            <p>
              {cv && active && shot.category === 'exterior'
                ? result.guidance
                : reference?.label || compositionGuide(shot, bodyStyle).note}
            </p>
            {result.available && cv && (
              <progress max="100" value={result.score} aria-label="Measured framing alignment" />
            )}
          </div>
        )}
        {pending && (
          <div className="capture-quality">
            <p>
              {pending.quality.width} × {pending.quality.height} ·{' '}
              {pending.source === 'sample' ? 'SAMPLE IMAGE' : 'Review photograph'}
            </p>
            {pending.quality.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}
      </main>
      <div className="camera-guidance">{shot.guidanceText}</div>
      {error && (
        <div className="camera-error" role="alert">
          {error}
        </div>
      )}
      <footer className="camera-actions">
        {pending ? (
          <>
            <button disabled={busy} onClick={() => setPending(null)}>
              <RotateCcw />
              Retake
            </button>
            <button className="primary" disabled={busy} onClick={() => void keep()}>
              <Check />
              {busy ? 'Saving…' : 'Keep Photo'}
            </button>
          </>
        ) : (
          <>
            <button
              aria-label="Previous shot"
              disabled={index === 0 || busy}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="shutter"
              disabled={busy || (!active && !sample)}
              aria-label={sample ? 'Capture sample photo' : 'Capture vehicle photo'}
              onClick={() => void shutter()}
            >
              <span />
            </button>
            <button
              aria-label="Next shot"
              disabled={index === template.shots.length - 1 || busy}
              onClick={() => setIndex((i) => i + 1)}
            >
              <ChevronRight />
            </button>
          </>
        )}
      </footer>
      {!pending && (
        <div className="camera-review-bar">
          <span>
            {existingShots.length} / {template.shots.length} saved locally
          </span>
          <button
            disabled={busy}
            onClick={async () => {
              try {
                await onFinishSession();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Unable to finish session.');
              }
            }}
          >
            Review checklist
          </button>
        </div>
      )}
      <OverlayControls
        settings={settings}
        onChange={setSettings}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={() => putSetting(key, settings)}
      >
        <h3>Camera controls</h3>
        <label>
          Output ratio
          <select
            value={ratio}
            aria-label="Output ratio"
            onChange={(e) => {
              setRatio(e.target.value as AspectRatio);
              setResolution('');
            }}
          >
            {['4:3', '16:9', '1:1'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Physical camera
          <select
            aria-label="Physical camera"
            value={deviceId}
            disabled={!devices.length || sample}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            <option value="">Preferred rear camera</option>
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={sample}
          onClick={() => {
            setDeviceId('');
            setFacing((p) => (p === 'environment' ? 'user' : 'environment'));
          }}
        >
          <SwitchCamera />
          Switch front / rear
        </button>
        <button
          disabled={!caps.torch || sample}
          onClick={async () => {
            if (await constrain({ torch: !torch })) setTorch(!torch);
          }}
        >
          <Zap />
          {torch ? 'Torch on' : 'Torch'} {!caps.torch && '— unsupported'}
        </button>
        <label>
          Hardware zoom {!caps.zoom && '— unsupported'}
          <input
            aria-label="Hardware zoom"
            type="range"
            disabled={!caps.zoom || sample}
            min={caps.zoom?.min || 1}
            max={caps.zoom?.max || 1}
            step={caps.zoom?.step || 0.1}
            value={zoom}
            onChange={async (e) => {
              const n = Number(e.target.value);
              if (await constrain({ zoom: n })) setZoom(n);
            }}
          />
        </label>
        <label>
          Exposure compensation {!caps.exposureCompensation && '— unsupported'}
          <input
            aria-label="Exposure compensation"
            type="range"
            disabled={!caps.exposureCompensation || sample}
            min={caps.exposureCompensation?.min || 0}
            max={caps.exposureCompensation?.max || 0}
            step={caps.exposureCompensation?.step || 0.1}
            value={exposure}
            onChange={async (e) => {
              const n = Number(e.target.value);
              if (await constrain({ exposureCompensation: n })) setExposure(n);
            }}
          />
        </label>
        <p>
          {caps.focusMode?.includes('single-shot') && 'pointsOfInterest' in caps
            ? 'Tap the frame to focus.'
            : 'Touch focus is not exposed by this browser; camera autofocus remains active.'}
        </p>
        <button
          onClick={async () => {
            try {
              const sensor = DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<string>;
              };
              if (sensor.requestPermission && (await sensor.requestPermission()) !== 'granted')
                setError('Motion permission denied. Manual horizon guidance remains available.');
            } catch {
              setError('Motion sensor unavailable.');
            }
          }}
        >
          Enable horizon sensor
        </button>
        <label className="checkbox-row">
          <input type="checkbox" checked={cv} onChange={(e) => setCv(e.target.checked)} />
          Experimental vehicle detection (18.5 MB local model)
        </label>
        <p>
          Bounding-box guidance only. No exact distance, viewing angle or segmentation estimate. Low
          confidence always uses manual alignment.
        </p>
        <button
          onClick={() => {
            setSample((s) => !s);
            setOpen(false);
          }}
        >
          {sample ? 'Return to real camera' : 'Enter sample-photo mode'}
        </button>
        <ReferenceStudio
          dealer={dealershipId}
          body={bodyStyle}
          shot={shot.code}
          onSaved={() => setRefRevision((n) => n + 1)}
        />
      </OverlayControls>
    </div>
  );
}
