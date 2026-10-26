import { referenceGeometry } from '@/services/references/geometry';
import { PhotographyStandard } from '@/types/capture';
import { AspectRatio } from '@/services/camera/geometry';
import { DEFAULT_STANDARD } from '@/services/standards';
import { useId } from 'react';
import { ReferenceAsset, compositionGuide } from '@/services/references/assets';
import { ShotDefinition } from '@/types/template';
import { BodyStyle } from '@/types/vehicle';
import { OverlaySettings } from './OverlayControls';
export function ReferenceOverlay({
  asset,
  shot,
  body,
  settings: s,
  ratio = '4:3',
  standard = DEFAULT_STANDARD,
}: {
  asset: ReferenceAsset | null;
  shot: ShotDefinition;
  body: BodyStyle;
  settings: OverlaySettings;
  ratio?: AspectRatio;
  standard?: PhotographyStandard;
}) {
  const id = useId().replace(/:/g, '');
  const guide = compositionGuide(shot, body);
  const geometry = referenceGeometry(asset, ratio, standard, s);
  const mirror = !!asset?.mirror !== !!s.mirror;
  return (
    <div
      className="reference-layer"
      data-testid="reference-overlay"
      style={{
        transform: `translate(${(s.x || 0) * 100}%,${(s.y || 0) * 100}%) scale(${s.scale})`,
      }}
    >
      {asset ? (
        <svg
          viewBox={`0 0 1000 ${geometry.height}`}
          width="100%"
          height="100%"
          aria-label="Realistic vehicle reference"
        >
          <defs>
            <clipPath id={`${id}-crop`}>
              <rect
                x={asset.rect[0]}
                y={asset.rect[1]}
                width={asset.rect[2]}
                height={asset.rect[3]}
              />
            </clipPath>
            <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius={s.emphasis || 1}
                result="outer"
              />
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius={s.emphasis || 1}
                result="inner"
              />
              <feComposite in="outer" in2="inner" operator="out" result="edge" />
              <feFlood floodColor={s.highVisibility ? '#ffe59b' : '#ffffff'} />
              <feComposite in2="edge" operator="in" />
            </filter>
          </defs>
          <g
            opacity={s.opacity}
            style={{
              filter: s.highVisibility
                ? 'drop-shadow(0 0 2px black) contrast(1.5)'
                : 'drop-shadow(0 0 1px white)',
            }}
          >
            <g
              transform={
                mirror ? `translate(${2 * standard.centerX * 1000} 0) scale(-1 1)` : undefined
              }
              filter={s.mode === 'edge' ? `url(#${id})` : undefined}
            >
              <svg
                x={geometry.x}
                y={geometry.y}
                width={geometry.width}
                height={geometry.h}
                viewBox={asset.rect.join(' ')}
                preserveAspectRatio="xMidYMid meet"
                overflow="hidden"
              >
                <image
                  clipPath={`url(#${id}-crop)`}
                  href={asset.url}
                  width={asset.imageWidth || 1254}
                  height={asset.imageHeight || 1254}
                />
              </svg>
            </g>
          </g>
          {s.anchors && (
            <g
              className="anchor-lines"
              stroke={s.highVisibility ? '#ffe59b' : 'white'}
              opacity="0.75"
              fill="none"
            >
              <path
                d={`M${geometry.x} ${standard.groundY * geometry.height}H${geometry.x + geometry.width} M500 ${geometry.y - 25}V${geometry.y + geometry.h + 25} M${geometry.x} ${geometry.y}H${geometry.x + geometry.width}`}
                strokeDasharray="12 9"
              />
              <path
                d={`M480 ${standard.centerY * geometry.height}h40 M500 ${standard.centerY * geometry.height - 20}v40`}
              />
              {!['STRAIGHT_FRONT', 'STRAIGHT_REAR', 'STEERING_DASHBOARD'].includes(shot.code) && (
                <>
                  {[
                    shot.code.includes('SIDE') ? [0.22, 0.8] : [0.58, 0.8],
                    shot.code.includes('SIDE') ? [0.78, 0.8] : [0.92, 0.65],
                  ].map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={
                        mirror
                          ? 1000 - (geometry.x + geometry.width * x)
                          : geometry.x + geometry.width * x
                      }
                      cy={geometry.y + geometry.h * y}
                      r="18"
                    />
                  ))}
                </>
              )}
            </g>
          )}
        </svg>
      ) : (
        <div className={`composition-region ${guide.region}`}>
          <div className="composition-center" />
          {s.anchors &&
            guide.landmarks.map((l, i) => (
              <span key={l} className={`landmark landmark-${i}`}>
                {l}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
