# Guided references V2

The active camera no longer imports `vehicleSilhouettes.tsx`; that file remains a legacy source artifact only. Primary exterior guidance comes from original photorealistic alpha raster atlases in `public/references/`. There are eight generic body packs and eight exterior views using mirrored counterparts where applicable. Hatchback/wagon and SUV/crossover share their nearest generic category. No exact VIN match is claimed.

`assets.ts` defines curated source windows. `ReferenceOverlay` clips the raster to prevent neighboring atlas cells leaking into the viewport. Neutral ghost is default; edge-only mode derives an alpha contour. Opacity, edge emphasis, position, scale, mirror, anchors, grid, visibility and sunlight mode are adjustable. Calibration is stored under dealership/body/shot. Geometry is computed in the selected output aspect, and CV targets use the same visible reference bounds.

Landmarks are approximate reference composition aids, not measured wheel centers on the real car. Shape variations require calibration or an approved reference. Engine, cargo, cluster, seats, controls, keys, condition and extra scenes use context-specific composition regions/landmarks instead of invented exact vehicle drawings. Missing raster assets fall back to explicit manual scene guidance.

Reference Studio accepts dealership-owned/licensed files. The manager traces a polygon around a vehicle/interior or supplies an already transparent PNG. Canvas clipping isolates that region locally; original and cutout bytes persist separately in settings. Approval is specific to dealership, body and shot. Automatic segmentation is not implemented.

[Original prompts and provenance](../public/references/provenance.json) record built-in image_gen generation. Generated examples are never presented as real inventory photographs.
