import { ADDITIONAL_SHOTS } from '@/services/templates/additionalShots';
import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft } from 'lucide-react';
import { CaptureTemplate } from '@/types/template';
import { loadTemplates, persistTemplates } from '@/services/templates/repository';
import { PhotographyStandardsEditor } from './PhotographyStandardsEditor';
import { getDefaultTemplates } from '@/services/templates/defaultTemplates';
interface TemplateManagerProps {
  dealershipId: string;
  onBack: () => void;
}
export const TemplateManager: React.FC<TemplateManagerProps> = ({ dealershipId, onBack }) => {
  const [templates, setTemplates] = useState<CaptureTemplate[]>(getDefaultTemplates(dealershipId));
  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0].id);
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let live = true;
    setLoaded(false);
    setMessage('');
    loadTemplates(dealershipId)
      .then((t) => {
        if (!live) return;
        setTemplates(t);
        setLoaded(true);
      })
      .catch(() => {
        if (live) setMessage('Templates could not be loaded.');
      });
    return () => {
      live = false;
    };
  }, [dealershipId, loadAttempt]);
  const saveTemplates = async () => {
    try {
      await persistTemplates(dealershipId, templates);
      setMessage(
        'Templates saved. New sessions use these settings; existing checklists are preserved.'
      );
    } catch {
      setMessage('Save failed. Template changes are not persisted.');
    }
  };
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];
  const handleToggleRequired = (shotId: string) => {
    const updatedShots = activeTemplate.shots.map((s) =>
      s.id === shotId ? { ...s, isRequired: !s.isRequired } : s
    );
    setTemplates((prev) =>
      prev.map((t) => (t.id === activeTemplateId ? { ...t, shots: updatedShots } : t))
    );
  };
  const handleSetHero = (shotId: string) => {
    const updatedShots = activeTemplate.shots.map((s) => ({
      ...s,
      isHero: s.id === shotId,
    }));
    setTemplates((prev) =>
      prev.map((t) => (t.id === activeTemplateId ? { ...t, shots: updatedShots } : t))
    );
  };
  if (!loaded)
    return (
      <section className="recovery-screen">
        <h1>Photography standards</h1>
        <p role={message ? 'alert' : 'status'}>{message || 'Loading your saved templates…'}</p>
        {message && (
          <button className="primary" onClick={() => setLoadAttempt((n) => n + 1)}>
            Retry loading templates
          </button>
        )}
        <button onClick={onBack}>Back to sessions</button>
      </section>
    );
  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-charcoal-900 border border-charcoal-750 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Dealership Photography Templates
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardize your lot photography sequence, required angles, and hero thumbnail
                standards.
              </p>
            </div>
          </div>
        </div>
        <PhotographyStandardsEditor dealer={dealershipId} />
        <button className="primary" disabled={!loaded} onClick={() => void saveTemplates()}>
          Save templates
        </button>
        <p role="status">{message}</p>
        {/* Template Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setActiveTemplateId(tpl.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                tpl.id === activeTemplateId
                  ? 'bg-charcoal-900 border-brand-cyan shadow-glow-cyan text-white'
                  : 'bg-charcoal-950 border-charcoal-800 text-slate-400 hover:border-charcoal-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate">{tpl.name}</span>
                {tpl.isDefault && (
                  <span className="text-[9px] font-mono text-brand-cyan bg-brand-cyan/20 px-1.5 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">{tpl.shots.length} Angles</p>
            </button>
          ))}
        </div>
        <label>
          Add an applicable scene
          <select
            aria-label="Add template scene"
            value=""
            onChange={(e) => {
              const extra = ADDITIONAL_SHOTS.find((s) => s.code === e.target.value);
              if (extra)
                setTemplates((ts) =>
                  ts.map((t) =>
                    t.id === activeTemplateId
                      ? { ...t, shots: [...t.shots, { ...extra, order: t.shots.length + 1 }] }
                      : t
                  )
                );
            }}
          >
            <option value="">Choose additional guide…</option>
            {ADDITIONAL_SHOTS.filter(
              (s) => !activeTemplate.shots.some((p) => p.code === s.code)
            ).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {/* Active Template Shot Checklist Editor */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-charcoal-800 gap-2">
            <div>
              <h2 className="text-base font-bold text-white">{activeTemplate.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeTemplate.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-charcoal-950 border border-charcoal-750 text-slate-300">
                <select
                  aria-label="Template aspect ratio"
                  value={activeTemplate.aspectRatio}
                  onChange={(e) =>
                    setTemplates((ts) =>
                      ts.map((t) =>
                        t.id === activeTemplateId
                          ? {
                              ...t,
                              aspectRatio: e.target.value as CaptureTemplate['aspectRatio'],
                              aspectRatioOverride: true,
                            }
                          : t
                      )
                    )
                  }
                >
                  {['4:3', '16:9', '1:1'].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-charcoal-950 border border-charcoal-750 text-slate-300">
                Target: {activeTemplate.targetResolutionWidth}x
                {activeTemplate.targetResolutionHeight}
              </span>
            </div>
          </div>
          <div className="mt-4 divide-y divide-charcoal-800">
            {activeTemplate.shots.map((shot, index) => (
              <div
                key={shot.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-charcoal-850/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-6">#{index + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{shot.name}</p>
                      {shot.isHero && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-amber/20 text-brand-amber text-[10px] font-bold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          HERO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">{shot.guidanceText}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSetHero(shot.id)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                      shot.isHero
                        ? 'bg-brand-amber/20 text-brand-amber border-brand-amber'
                        : 'text-slate-500 border-charcoal-750 hover:text-white'
                    }`}
                    title="Make Hero Image"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleToggleRequired(shot.id)}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      shot.isRequired
                        ? 'bg-hud-green/20 text-hud-green border-hud-green/50'
                        : 'bg-charcoal-800 text-slate-400 border-charcoal-700'
                    }`}
                  >
                    {shot.isRequired ? 'Required' : 'Optional'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
