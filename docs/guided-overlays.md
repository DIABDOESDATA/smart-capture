# Guided Vehicle Overlays & Vector Silhouettes

## 1. Silhouette Proportions & Body Classification

Smart Capture does NOT use generic rectangular boxes for vehicle alignment. Each body class has distinct proportions, rooflines, ground clearances, and overhangs:

| Body Style | Silhouette Geometry Characteristics | Key Framing Anchors |
| --- | --- | --- |
| **Sedan** | Balanced 3-box design (engine bay, passenger compartment, trunk). Moderate roofline height. | Front/rear wheel centers, beltline, hood edge |
| **SUV / Crossover** | Taller roofline (25% higher greenhouse), high ground clearance, squared rear liftgate. | High beltline, large wheel arch clearance, roof rails |
| **Pickup Truck** | Upright grille, distinct crew/extended cab boundary, flat rear bed with tailgate. | Wheelbases, cab-to-bed gap, bed height |
| **Coupe** | Fastback sloping roofline, long hood, short rear deck, low athletic stance. | Aggressive windshield rake, low rocker panel |
| **Convertible** | Low beltline, open cockpit or cloth top silhouette reference. | Windshield header, folded roof cowl |
| **Hatchback / Wagon** | Extended cargo roofline running into steep rear tailgate. | Cargo glass boundary, rear wiper area |

## 2. Supported Angle Sequences

Each body style features specialized vectors for all standard exterior angles:
1. `FRONT_3Q_DRIVER` (Primary Hero angle — 45° perspective with wheel guides)
2. `STRAIGHT_FRONT` (Center-line symmetry axis with grille, headlights, and mirror boxes)
3. `FRONT_3Q_PASSENGER` (Mirrored 45° perspective)
4. `PASSENGER_SIDE` & `DRIVER_SIDE` (Flat profile with ground plane line and wheel positioning guides)
5. `REAR_3Q_PASSENGER` & `REAR_3Q_DRIVER` (Rear 45° quarter panel, taillight and exhaust tips)
6. `STRAIGHT_REAR` (Center rear bumper, license plate bracket, and window frame)

### Detail Framing Guides:
- **Wheel & Tire Closeup**: Circular tire tread outer boundary, inner alloy rim guide, center cap reticle, and brake caliper arc.
- **Steering Wheel & Cockpit**: 360° steering rim, center airbag hub, dashboard cowl horizon line, infotainment display boundary.
- **Instrument Cluster**: Visor boundary, speedometer & tachometer dual dials, center digital odometer display box.
- **VIN Door Jamb**: Federal safety certification label rectangular boundary with barcode alignment guide line.
- **Engine Bay**: Perimeter fender & cowl box with center engine cover outline.

## 3. Photographer HUD Controls

The photographer can customize the HUD in real-time during lot shoots:
- **Opacity Slider (10% to 90%)**: Allows high visibility against dark asphalt or subtle ghosting against bright white vehicles.
- **Color Presets**:
  - High-Vis Cyan (`#06B6D4`): Optimal contrast against concrete, asphalt, and black/grey/silver vehicles.
  - Neon Green (`#22C55E`): High contrast against dark paint and shaded lots.
  - Electric Amber (`#F59E0B`): Optimal visibility in bright sun against white/cream vehicles.
  - Crisp White (`#FFFFFF`): Traditional neutral studio reference.
- **Scale / Zoom Guide (+/- 20%)**: Accommodates compact subcompacts up to heavy-duty dually pickup trucks.
- **Horizon Tilt Toggle**: Shows/hides sensor-based roll line.
- **3x3 Rule-of-Thirds Grid**: Professional composition overlay.
