# Physical dealership acceptance — NOT RUN

Owner approval is required before integration or production deployment. None of the following results has been fabricated or inferred from browser emulation.

## Set up

Use an approved HTTPS origin on physical Android Chrome and iOS Safari. Test Desktop Chrome for administration/sample use. Record device, OS, browser, camera/lens, battery state, actual output resolution and app commit. Export originals and manifests for inspection on a large screen.

## Repeatable vehicle matrix

| Vehicle / conditions | Complete 20-shot session | Preview vs saved crop | Reference usefulness | Blur/exposure | Reload/offline | Time / missed shots |
|---|---|---|---|---|---|---|
| Light sedan — sun | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Dark sedan — shade | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Light SUV — sun/interior | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Dark SUV — shade/interior | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Pickup — sun, bed/engine/cab | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Pickup — shade/interior | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

## Per-device checklist

- [ ] Permission deny/retry; sample mode always separate. Never use generated samples as inventory.
- [ ] Rear selection, device/lens list and supported zoom/exposure/torch/focus actually change the hardware; unavailable capabilities stay disabled.
- [ ] 4:3, 16:9, square and both phone orientations: saved bumper/roof/tire margins match the viewfinder. Inspect output pixels/resolution, not only thumbnails.
- [ ] Motion grant/deny; level changes in both orientations; flat/missing/stale sensor never asserts LEVEL.
- [ ] Photograph eight exterior views plus cockpit/dashboard/cluster/seats/engine/cargo; adjust and save body reference calibration. Review wheel/roof/ground anchors against the actual shape.
- [ ] Upload an approved dealer photo, trace its subject boundary, reload and verify that the correct body/shot reference appears.
- [ ] Accept a photo, background/foreground, lock/unlock, reload offline, resume; no wrong-shot/vehicle associations or duplicates.
- [ ] Retake, compare prior image, reorder, set hero, adjust derivative and restore original. Damage remains visible.
- [ ] Export one image and complete ZIP without connectivity; inspect JPEG dimensions, ordering, manifest source, original/derivative separation, hero and actual-image hotspot links.
- [ ] Low storage and save rejection retain pending review. Export then delete a test session only; verify space is recovered.
- [ ] If enabling CV, measure cold/warm load, total memory/thermal effect, FPS, correct/incorrect vehicle boxes and low-confidence fallback in busy lots. Never require CV to finish.

## Measured acceptance record

Record actual start/finish and active capture times separately, missed angles, retake counts, quality false positives/negatives, reference adjustments per body, employee feedback and crashes. Compare the same hero shot across at least five vehicles using the batch tool. Agree target tolerances using observed position/coverage/tilt, rather than inventing consistency percentages. Attach selected original images only with dealership permission. Leave outcome fields NOT RUN until a human completes them.
