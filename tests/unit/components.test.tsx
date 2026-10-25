import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayControls } from '@/components/camera/overlays/OverlayControls';
import { QualityWarningBanner } from '@/components/camera/QualityWarningBanner';
import { VinLookupForm } from '@/components/vehicle/VinLookupForm';

describe('Smart Capture Component Suite', () => {
  it('renders OverlayControls and emits setting updates', () => {
    const handleChange = vi.fn();
    const handleClose = vi.fn();

    render(
      <OverlayControls
        isOpen={true}
        onClose={handleClose}
        onChange={handleChange}
        settings={{
          isVisible: true,
          opacity: 0.6,
          color: '#06B6D4',
          showHorizon: true,
          showGrid: false,
          scale: 1.0,
        }}
      />
    );

    expect(screen.getByText('HUD Overlay Controls')).toBeInTheDocument();

    // Toggle outline
    const outlineBtn = screen.getByRole('button', { name: /Outline/i });
    fireEvent.click(outlineBtn);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isVisible: false }));

    // Toggle horizon
    const horizonBtn = screen.getByRole('button', { name: /Horizon/i });
    fireEvent.click(horizonBtn);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ showHorizon: false }));
  });

  it('renders QualityWarningBanner with actionable Retake and Keep buttons', () => {
    const handleRetake = vi.fn();
    const handleKeep = vi.fn();

    render(
      <QualityWarningBanner
        quality={{
          blurScore: 42,
          isBlurry: true,
          exposure: 'underexposed',
          meanLuminance: 30,
          tiltDegrees: 1.0,
          isLevel: true,
          width: 1920,
          height: 1080,
          warnings: ['Blur detected', 'Scene underexposed'],
        }}
        onRetake={handleRetake}
        onKeepAnyway={handleKeep}
      />
    );

    expect(screen.getByText('Photo Quality Advisory')).toBeInTheDocument();
    expect(screen.getByText('Blur detected')).toBeInTheDocument();
    expect(screen.getByText('Scene underexposed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Retake Shot/i }));
    expect(handleRetake).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Keep Anyway/i }));
    expect(handleKeep).toHaveBeenCalledTimes(1);
  });

  it('renders VinLookupForm and allows vehicle manual creation', () => {
    const handleVehicleSelected = vi.fn();
    const handleOpenScanner = vi.fn();

    render(
      <VinLookupForm
        dealershipId="dealership-ddrive-01"
        onVehicleSelected={handleVehicleSelected}
        onOpenVinScanner={handleOpenScanner}
      />
    );

    expect(screen.getByText('Vehicle Identification')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Start Guided Capture Session/i });
    fireEvent.click(submitBtn);

    expect(handleVehicleSelected).toHaveBeenCalledTimes(1);
    expect(handleVehicleSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        dealershipId: 'dealership-ddrive-01',
        bodyStyle: 'sedan',
      })
    );
  });
});
