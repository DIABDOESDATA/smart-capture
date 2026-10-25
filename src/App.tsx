import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { VinLookupForm } from './components/vehicle/VinLookupForm';
import { VinScannerModal } from './components/vehicle/VinScannerModal';
import { SmartCameraView } from './components/camera/SmartCameraView';
import { SessionGallery } from './components/gallery/SessionGallery';
import { TemplateManager } from './components/templates/TemplateManager';
import { LandingPage } from './components/landing/LandingPage';
import { Dealership, UserRole } from './types/dealership';
import { Vehicle } from './types/vehicle';
import { VehicleCaptureSession, CapturedShot } from './types/capture';
import { CaptureTemplate } from './types/template';
import {
  getDefaultTemplates,
  getTemplateForBodyStyle,
} from './services/templates/defaultTemplates';
import {
  saveSession,
  getAllSessions,
  saveVehicle,
  getAllVehicles,
  saveDealership,
} from './services/storage/indexedDb';

const DEFAULT_DEALERSHIP: Dealership = {
  id: 'dealership-ddrive-01',
  name: 'D-Drive Auto',
  slug: 'd-drive-auto',
  city: 'Dallas',
  state: 'TX',
  planId: 'pro',
  maxActiveTemplates: 5,
  monthlyVehicleQuota: 250,
  storageQuotaGb: 25,
  storageUsedMb: 420.5,
  createdAt: new Date().toISOString(),
};

export function App() {
  const [currentDealership] = useState<Dealership>(DEFAULT_DEALERSHIP);
  const [userRole] = useState<UserRole>('manager');
  const [currentView, setCurrentView] = useState<
    'landing' | 'dashboard' | 'new-session' | 'camera' | 'gallery' | 'templates'
  >('dashboard');

  const [isVinScannerOpen, setIsVinScannerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<VehicleCaptureSession[]>([]);

  // Active session state
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [activeSession, setActiveSession] = useState<VehicleCaptureSession | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<CaptureTemplate>(
    getDefaultTemplates(DEFAULT_DEALERSHIP.id)[0]
  );
  const [cameraInitialShotIndex, setCameraInitialShotIndex] = useState(0);

  // Load local IndexedDB records on mount
  useEffect(() => {
    async function loadData() {
      try {
        await saveDealership(DEFAULT_DEALERSHIP);
        const storedSessions = await getAllSessions(DEFAULT_DEALERSHIP.id);
        const storedVehicles = await getAllVehicles(DEFAULT_DEALERSHIP.id);

        if (storedSessions.length > 0) {
          setSessions(storedSessions);
        }
        if (storedVehicles.length > 0) {
          setVehicles(storedVehicles);
        }
      } catch (err) {
        console.warn('Local database load error:', err);
      }
    }
    loadData();
  }, []);

  // Handler: When vehicle is identified from VIN form
  const handleVehicleSelected = async (vehicle: Vehicle) => {
    const template = getTemplateForBodyStyle(vehicle.bodyStyle, currentDealership.id);
    setActiveVehicle(vehicle);
    setActiveTemplate(template);

    // Create new capture session
    const newSession: VehicleCaptureSession = {
      id: `sess-${Date.now()}`,
      dealershipId: currentDealership.id,
      vehicleId: vehicle.id,
      templateId: template.id,
      employeeId: 'emp-01',
      employeeName: 'Lot Specialist',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      shots: [],
      syncPendingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveSession(newSession);
    setCameraInitialShotIndex(0);

    // Persist locally
    await saveVehicle(vehicle);
    await saveSession(newSession);

    setVehicles((prev) => [vehicle, ...prev.filter((v) => v.id !== vehicle.id)]);
    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);

    setCurrentView('camera');
  };

  // Handler: Capture photo in camera
  const handleCaptureShot = async (shot: CapturedShot) => {
    if (!activeSession) return;

    // Replace or add shot
    const existingIndex = activeSession.shots.findIndex((s) => s.shotCode === shot.shotCode);
    let updatedShots: CapturedShot[];
    if (existingIndex >= 0) {
      updatedShots = [...activeSession.shots];
      updatedShots[existingIndex] = {
        ...shot,
        retakeCount: (updatedShots[existingIndex].retakeCount || 0) + 1,
      };
    } else {
      updatedShots = [...activeSession.shots, shot];
    }

    const updatedSession: VehicleCaptureSession = {
      ...activeSession,
      shots: updatedShots,
      updatedAt: new Date().toISOString(),
    };

    setActiveSession(updatedSession);
    await saveSession(updatedSession);
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
  };

  // Handler: Finish session
  const handleFinishSession = async () => {
    if (!activeSession) return;
    const completedSession: VehicleCaptureSession = {
      ...activeSession,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveSession(completedSession);
    await saveSession(completedSession);
    setSessions((prev) => prev.map((s) => (s.id === completedSession.id ? completedSession : s)));
    setCurrentView('gallery');
  };

  // Handler: Open existing session from dashboard
  const handleOpenSession = (session: VehicleCaptureSession) => {
    const veh = vehicles.find((v) => v.id === session.vehicleId);
    const tpl =
      getDefaultTemplates().find((t) => t.id === session.templateId) || getDefaultTemplates()[0];

    setActiveSession(session);
    if (veh) setActiveVehicle(veh);
    setActiveTemplate(tpl);
    setCurrentView('gallery');
  };

  // Handler: Retake a specific shot from gallery
  const handleRetakeShot = (shotIndex: number) => {
    setCameraInitialShotIndex(shotIndex);
    setCurrentView('camera');
  };

  // Handler: Update gallery shots after reorder or hero assignment
  const handleUpdateShots = async (shots: CapturedShot[]) => {
    if (!activeSession) return;
    const updated: VehicleCaptureSession = {
      ...activeSession,
      shots,
      updatedAt: new Date().toISOString(),
    };
    setActiveSession(updated);
    await saveSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Render view
  if (currentView === 'landing') {
    return <LandingPage onEnterApp={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentDealership={currentDealership}
        userRole={userRole}
        currentView={currentView as 'landing' | 'dashboard' | 'new-session' | 'templates'}
        onNavigate={(view) => setCurrentView(view)}
      />

      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            sessions={sessions}
            vehicles={vehicles}
            onStartNewSession={() => setCurrentView('new-session')}
            onOpenSession={handleOpenSession}
          />
        )}

        {currentView === 'new-session' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <VinLookupForm
              dealershipId={currentDealership.id}
              onVehicleSelected={handleVehicleSelected}
              onOpenVinScanner={() => setIsVinScannerOpen(true)}
            />
          </div>
        )}

        {currentView === 'camera' && activeVehicle && (
          <SmartCameraView
            template={activeTemplate}
            bodyStyle={activeVehicle.bodyStyle}
            initialShotIndex={cameraInitialShotIndex}
            existingShots={activeSession?.shots || []}
            onCaptureShot={handleCaptureShot}
            onFinishSession={handleFinishSession}
            onClose={() => setCurrentView('gallery')}
          />
        )}

        {currentView === 'gallery' && activeSession && activeVehicle && (
          <SessionGallery
            session={activeSession}
            template={activeTemplate}
            vehicle={activeVehicle}
            onRetakeShot={handleRetakeShot}
            onUpdateShots={handleUpdateShots}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'templates' && (
          <TemplateManager
            dealershipId={currentDealership.id}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      <VinScannerModal
        isOpen={isVinScannerOpen}
        onClose={() => setIsVinScannerOpen(false)}
        onVinScanned={(_scannedVin) => {
          // Handled via modal callback
        }}
      />
    </div>
  );
}

export default App;
