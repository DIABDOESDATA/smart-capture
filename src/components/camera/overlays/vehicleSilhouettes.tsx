import React from 'react';
import { BodyStyle } from '@/types/vehicle';
import { ShotAngle } from '@/types/template';

interface SilhouetteProps {
  bodyStyle: BodyStyle;
  shotCode: ShotAngle;
  color: string;
  strokeWidth?: number;
}

/**
 * High-precision vector silhouettes engineered for automotive proportions.
 * Each silhouette reflects the exact body style roofline, hood line, and wheel placement.
 */
export const VehicleSilhouette: React.FC<SilhouetteProps> = ({
  bodyStyle,
  shotCode,
  color,
  strokeWidth = 2,
}) => {
  // Common wheel guides, horizon line, and alignment crosshairs
  const renderHorizonAndWheelGuides = (leftWheelX: number, rightWheelX: number, wheelY: number) => (
    <g opacity={0.6}>
      {/* Ground plane alignment line */}
      <line
        x1="5%"
        y1={wheelY + 18}
        x2="95%"
        y2={wheelY + 18}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      {/* Wheel positioning circles */}
      <circle
        cx={leftWheelX}
        cy={wheelY}
        r={18}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <circle
        cx={rightWheelX}
        cy={wheelY}
        r={18}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
    </g>
  );

  // 1. FRONT 3/4 DRIVER (Hero Angle)
  if (shotCode === 'FRONT_3Q_DRIVER') {
    if (bodyStyle === 'truck') {
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {renderHorizonAndWheelGuides(105, 290, 180)}
          {/* Truck Front 3/4: High hood, tall upright grille, crew cab, pickup bed */}
          <path
            d="M 65 185 L 60 145 L 85 130 L 150 125 L 190 75 L 290 75 L 305 105 L 350 110 L 350 175 L 320 185 M 150 125 L 180 180 M 190 75 L 180 125 L 290 125 M 65 155 L 150 150"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Wheel wells */}
          <path
            d="M 85 185 A 25 25 0 0 1 135 185"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M 270 185 A 25 25 0 0 1 320 185"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    if (bodyStyle === 'suv' || bodyStyle === 'crossover') {
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {renderHorizonAndWheelGuides(100, 285, 180)}
          {/* SUV Front 3/4: Tall roof, high beltline, rear cargo window */}
          <path
            d="M 60 180 L 60 145 L 90 135 L 155 130 L 195 70 L 320 70 L 345 105 L 345 175 L 315 180 M 155 130 L 185 180 M 195 70 L 185 130 L 320 130 M 60 155 L 155 150"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d="M 80 180 A 24 24 0 0 1 130 180"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M 265 180 A 24 24 0 0 1 315 180"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    if (bodyStyle === 'coupe') {
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {renderHorizonAndWheelGuides(95, 295, 180)}
          {/* Coupe Front 3/4: Sleek low hood, aggressive fastback roof, low stance */}
          <path
            d="M 50 180 L 50 155 L 85 140 L 160 135 L 205 90 L 305 95 L 345 140 L 350 175 L 325 180 M 160 135 L 185 180 M 205 90 L 190 135 L 305 135 M 50 162 L 160 155"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d="M 75 180 A 22 22 0 0 1 125 180"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M 275 180 A 22 22 0 0 1 325 180"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    // Default: Sedan Front 3/4 Hero
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {renderHorizonAndWheelGuides(95, 290, 180)}
        {/* Sedan proportions: Balanced 3-box shape */}
        <path
          d="M 55 180 L 55 150 L 85 138 L 155 132 L 200 82 L 300 85 L 345 130 L 348 175 L 320 180 M 155 132 L 185 180 M 200 82 L 185 132 L 305 132 M 55 160 L 155 152"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M 75 180 A 23 23 0 0 1 125 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <path
          d="M 270 180 A 23 23 0 0 1 320 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 2. STRAIGHT FRONT
  if (shotCode === 'STRAIGHT_FRONT') {
    const isTall = bodyStyle === 'suv' || bodyStyle === 'truck';
    const topY = isTall ? 70 : 85;
    const hoodY = isTall ? 120 : 135;

    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Center vertical alignment axis */}
        <line
          x1="200"
          y1="40"
          x2="200"
          y2="200"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        {/* Horizontal bumper axis */}
        <line
          x1="60"
          y1="180"
          x2="340"
          y2="180"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        {/* Windshield & Greenhouse */}
        <path
          d={`M 130 ${topY} L 270 ${topY} L 295 ${hoodY} L 105 ${hoodY} Z`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Main Body & Grille Outline */}
        <path
          d={`M 85 180 L 80 150 L 105 ${hoodY} L 295 ${hoodY} L 320 150 L 315 180 Z`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Headlight boxes */}
        <rect
          x="95"
          y={hoodY + 6}
          width="40"
          height="18"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <rect
          x="265"
          y={hoodY + 6}
          width="40"
          height="18"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Center Grille */}
        <rect
          x="155"
          y={hoodY + 8}
          width="90"
          height="28"
          rx="6"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Side mirrors */}
        <rect
          x="65"
          y={hoodY - 15}
          width="25"
          height="14"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <rect
          x="310"
          y={hoodY - 15}
          width="25"
          height="14"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 3. FRONT 3/4 PASSENGER
  if (shotCode === 'FRONT_3Q_PASSENGER') {
    return (
      <svg
        viewBox="0 0 400 240"
        className="w-full h-full transform scale-x-[-1]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Mirrored driver 3/4 */}
        {renderHorizonAndWheelGuides(95, 290, 180)}
        <path
          d="M 55 180 L 55 150 L 85 138 L 155 132 L 200 82 L 300 85 L 345 130 L 348 175 L 320 180 M 155 132 L 185 180 M 200 82 L 185 132 L 305 132 M 55 160 L 155 152"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M 75 180 A 23 23 0 0 1 125 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <path
          d="M 270 180 A 23 23 0 0 1 320 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 4. FULL PROFILE (Passenger or Driver Side)
  if (shotCode === 'PASSENGER_SIDE' || shotCode === 'DRIVER_SIDE') {
    const isTruck = bodyStyle === 'truck';
    const isSuv = bodyStyle === 'suv' || bodyStyle === 'crossover';

    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {renderHorizonAndWheelGuides(105, 295, 175)}
        {isTruck ? (
          /* Pickup Truck Profile */
          <path
            d="M 45 175 L 45 145 L 65 135 L 135 135 L 165 80 L 255 80 L 265 135 L 355 135 L 355 175 Z M 165 80 L 165 135 M 215 80 L 215 135"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ) : isSuv ? (
          /* SUV Full Profile */
          <path
            d="M 45 175 L 45 145 L 70 135 L 140 130 L 175 75 L 320 75 L 345 125 L 350 175 Z M 175 75 L 175 130 M 245 75 L 245 130 M 310 75 L 310 130"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ) : (
          /* Sedan Profile */
          <path
            d="M 45 175 L 45 150 L 70 140 L 135 138 L 180 88 L 285 88 L 330 140 L 355 145 L 355 175 Z M 180 88 L 180 138 M 240 88 L 240 138"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        )}
        {/* Wheel wells */}
        <path
          d="M 85 175 A 25 25 0 0 1 135 175"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <path
          d="M 275 175 A 25 25 0 0 1 325 175"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 5. REAR 3/4 (Passenger or Driver Side)
  if (shotCode === 'REAR_3Q_PASSENGER' || shotCode === 'REAR_3Q_DRIVER') {
    const isMirrored = shotCode === 'REAR_3Q_DRIVER';
    return (
      <svg
        viewBox="0 0 400 240"
        className={`w-full h-full ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {renderHorizonAndWheelGuides(105, 290, 180)}
        <path
          d="M 60 180 L 60 145 L 100 135 L 170 85 L 275 85 L 325 135 L 345 150 L 345 180 Z M 100 135 L 275 135 M 170 85 L 165 135"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M 85 180 A 23 23 0 0 1 135 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <path
          d="M 270 180 A 23 23 0 0 1 320 180"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Taillight guide */}
        <rect
          x="75"
          y="142"
          width="35"
          height="15"
          rx="3"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 6. STRAIGHT REAR
  if (shotCode === 'STRAIGHT_REAR') {
    const isTall = bodyStyle === 'suv' || bodyStyle === 'truck';
    const topY = isTall ? 70 : 85;
    const trunkY = isTall ? 120 : 135;

    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <line
          x1="200"
          y1="40"
          x2="200"
          y2="200"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        {/* Rear Window */}
        <path
          d={`M 130 ${topY} L 270 ${topY} L 295 ${trunkY} L 105 ${trunkY} Z`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Trunk & Bumper */}
        <path
          d={`M 85 180 L 80 150 L 105 ${trunkY} L 295 ${trunkY} L 320 150 L 315 180 Z`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Taillights */}
        <rect
          x="90"
          y={trunkY + 8}
          width="45"
          height="16"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <rect
          x="265"
          y={trunkY + 8}
          width="45"
          height="16"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* License Plate Bracket */}
        <rect
          x="170"
          y={trunkY + 12}
          width="60"
          height="28"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Dual Exhaust Tips */}
        <circle cx="105" cy="182" r="7" fill="none" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="295" cy="182" r="7" fill="none" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  // 7. WHEEL & TIRE CLOSEUP
  if (shotCode === 'WHEEL_FRONT_DRIVER' || shotCode === 'WHEEL_REAR_PASSENGER') {
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Outer tire guide */}
        <circle cx="200" cy="120" r="95" fill="none" stroke={color} strokeWidth={strokeWidth} />
        {/* Inner rim guide */}
        <circle
          cx="200"
          cy="120"
          r="65"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="6 4"
        />
        {/* Center hub / manufacturer logo circle */}
        <circle cx="200" cy="120" r="22" fill="none" stroke={color} strokeWidth={strokeWidth} />
        {/* Caliper guide area */}
        <path
          d="M 140 100 A 70 70 0 0 1 155 70"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 2}
        />
      </svg>
    );
  }

  // 8. STEERING WHEEL & DASHBOARD
  if (shotCode === 'STEERING_DASHBOARD' || shotCode === 'DRIVER_COCKPIT') {
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Steering wheel outer ring */}
        <circle cx="150" cy="130" r="65" fill="none" stroke={color} strokeWidth={strokeWidth} />
        {/* Steering wheel center hub */}
        <circle cx="150" cy="130" r="25" fill="none" stroke={color} strokeWidth={strokeWidth} />
        {/* Dashboard horizon / instrument visor */}
        <path
          d="M 50 85 Q 150 70 250 85 L 360 95 L 360 190 L 50 190 Z"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
        {/* Center Infotainment frame */}
        <rect
          x="255"
          y="100"
          width="85"
          height="55"
          rx="6"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // 9. INSTRUMENT CLUSTER & ODOMETER
  if (shotCode === 'INSTRUMENT_CLUSTER') {
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Main cluster visor frame */}
        <rect
          x="60"
          y="45"
          width="280"
          height="150"
          rx="20"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Left dial (Tachometer) */}
        <circle
          cx="125"
          cy="120"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="5 3"
        />
        {/* Right dial (Speedometer) */}
        <circle
          cx="275"
          cy="120"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="5 3"
        />
        {/* Center digital display / Odometer box */}
        <rect
          x="180"
          y="100"
          width="40"
          height="40"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Center crosshair */}
        <line
          x1="200"
          y1="90"
          x2="200"
          y2="150"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.6}
        />
      </svg>
    );
  }

  // 10. VIN PLATE / DOOR JAMB
  if (shotCode === 'VIN_DOOR_JAMB') {
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* VIN sticker / metal plate boundary */}
        <rect
          x="80"
          y="55"
          width="240"
          height="130"
          rx="8"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Barcode / 17-digit character guide line */}
        <line
          x1="100"
          y1="120"
          x2="300"
          y2="120"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="4 2"
        />
        <rect
          x="100"
          y="75"
          width="80"
          height="25"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
      </svg>
    );
  }

  // 11. ENGINE BAY
  if (shotCode === 'ENGINE_BAY') {
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Engine Bay perimeter framing */}
        <rect
          x="50"
          y="40"
          width="300"
          height="160"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Center Engine Cover */}
        <rect
          x="135"
          y="75"
          width="130"
          height="90"
          rx="10"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Battery / Airbox reference guides */}
        <rect
          x="65"
          y="60"
          width="50"
          height="45"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
        <rect
          x="285"
          y="60"
          width="50"
          height="45"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
      </svg>
    );
  }

  // Fallback: Professional Framing Grid & Center Focus Reticle
  return (
    <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Outer framing box */}
      <rect
        x="50"
        y="35"
        width="300"
        height="170"
        rx="12"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Center crosshair reticle */}
      <circle
        cx="200"
        cy="120"
        r="30"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <line x1="200" y1="80" x2="200" y2="160" stroke={color} strokeWidth={1} opacity={0.7} />
      <line x1="160" y1="120" x2="240" y2="120" stroke={color} strokeWidth={1} opacity={0.7} />
    </svg>
  );
};
