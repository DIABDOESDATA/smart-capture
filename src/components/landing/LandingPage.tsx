import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Building2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [pilotEmail, setPilotEmail] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  const handlePilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotEmail || !dealershipName) return;
    setPilotSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* 1. TOP NAVIGATION */}
      <nav className="border-b border-charcoal-800 bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center text-charcoal-950 shadow-glow-cyan">
              <Camera className="w-5 h-5 font-bold" />
            </div>
            <span className="font-bold text-lg tracking-wider text-white">SMART CAPTURE</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onEnterApp}
              className="py-2 px-4 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs tracking-wide shadow-glow-cyan active:scale-95 transition-all flex items-center gap-1.5"
            >
              Launch Studio App
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Engineered for Independent Dealerships & Dealer Groups
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Consistent Vehicle Photos.{' '}
          <span className="bg-gradient-to-r from-brand-cyan via-teal-300 to-brand-amber bg-clip-text text-transparent">
            Every Car. Every Time.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Guide your team through professional vehicle photography with instant VIN recognition,
          on-screen framing silhouettes, and automated dealership gallery organization.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-sm tracking-wide shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Open Guided Camera Demo
          </button>
          <a
            href="#pilot"
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-charcoal-900 hover:bg-charcoal-800 text-slate-200 border border-charcoal-750 font-semibold text-sm transition-all"
          >
            Apply for Dealer Pilot
          </a>
        </div>
      </section>

      {/* 3. PROBLEM & SOLUTION GRID */}
      <section className="py-16 bg-charcoal-900/50 border-y border-charcoal-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              The Real Car Lot Photography Problem
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Feedback from actual dealership operators reveals why inventory photos fail.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-hud-red/20 text-hud-red flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">The Angle Inconsistency</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Different employees photograph vehicles at random distances, heights, and angles.
                Your digital showroom looks disorganized and unprofessional.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-brand-amber/20 text-brand-amber flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Costly Missing Shots & Retakes</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Staff forget key angles like the odometer, window sticker, or trunk. The car must be
                pulled back out, parked, and re-photographed.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-brand-cyan/20 text-brand-cyan flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Tedious Upload Organization</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sorting dozens of unordered smartphone photos, picking a hero thumbnail, and
                renaming files wastes hours every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW SMART CAPTURE WORKS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Automotive Photography In 4 Simple Steps
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
            <span className="text-2xl font-mono font-bold text-brand-cyan">01</span>
            <h4 className="font-bold text-sm text-white mt-2">Scan or Enter VIN</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Official NHTSA vPIC vehicle decoder identifies Year, Make, Model, and Body Style
              automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
            <span className="text-2xl font-mono font-bold text-brand-cyan">02</span>
            <h4 className="font-bold text-sm text-white mt-2">Guided Silhouette Camera</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Transparent body-specific outlines and horizon tilt guides show exactly how to frame
              each angle.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
            <span className="text-2xl font-mono font-bold text-brand-cyan">03</span>
            <h4 className="font-bold text-sm text-white mt-2">Instant Quality Checks</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Automated on-device blur detection and exposure analysis advise staff before they
              leave the lot.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
            <span className="text-2xl font-mono font-bold text-brand-cyan">04</span>
            <h4 className="font-bold text-sm text-white mt-2">Export & Syndication</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              One-click standardized ZIP download or instant direct sync to dealer websites and DMS
              platforms.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRICING TIERS */}
      <section className="py-16 bg-charcoal-900/50 border-t border-charcoal-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Simple, Predictable Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              No long-term contracts. Designed for independent dealers and growing dealer groups.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Basic Tier */}
            <div className="p-6 rounded-3xl bg-charcoal-900 border border-charcoal-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Basic</h3>
                <p className="text-xs text-slate-400 mt-1">For single-lot independent dealers</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white font-mono">$39</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Guided camera with all vehicle silhouettes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    NHTSA VIN decoding & barcode scan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Standard 20-shot and 12-shot templates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Ordered ZIP & manifest export
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-6 w-full py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-xs transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Pro Tier (Highlighted) */}
            <div className="p-6 rounded-3xl bg-charcoal-900 border-2 border-brand-cyan relative flex flex-col justify-between shadow-glow-cyan">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-cyan text-charcoal-950 font-bold text-[10px] tracking-wider uppercase">
                Most Popular
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Pro</h3>
                <p className="text-xs text-slate-400 mt-1">
                  For active dealerships seeking consistency
                </p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white font-mono">$79</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Everything in Basic
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Custom dealership templates & required shots
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Real-time blur, exposure & tilt diagnostics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Direct DMS / Website sync integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Multi-employee lot user accounts
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-6 w-full py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs shadow-md transition-colors"
              >
                Launch Pro Studio
              </button>
            </div>

            {/* Dealer Group Tier */}
            <div className="p-6 rounded-3xl bg-charcoal-900 border border-charcoal-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Dealer Group</h3>
                <p className="text-xs text-slate-400 mt-1">
                  For multi-location groups & franchises
                </p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white font-mono">Custom</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Multiple dealership rooftops & locations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Centralized management & audit reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Dedicated API & custom DMS connectors
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                    Priority support & on-lot staff onboarding
                  </li>
                </ul>
              </div>
              <a
                href="#pilot"
                className="mt-6 w-full py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-xs transition-colors text-center"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PILOT APPLICATION FORM */}
      <section id="pilot" className="py-16 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 text-brand-cyan flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Apply for the Dealership Pilot Program</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            We are accepting 3 independent dealerships for our hands-on pilot testing program.
            Includes customized templates and free full platform access.
          </p>

          {pilotSubmitted ? (
            <div className="mt-6 p-4 rounded-2xl bg-hud-green/20 border border-hud-green text-hud-green text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Pilot application received! Our engineering team will contact you shortly.
            </div>
          ) : (
            <form
              onSubmit={handlePilotSubmit}
              className="mt-6 space-y-3 max-w-sm mx-auto text-left"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dealership Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Auto Gallery"
                  value={dealershipName}
                  onChange={(e) => setDealershipName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Manager Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="manager@dealership.com"
                  value={pilotEmail}
                  onChange={(e) => setPilotEmail(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs tracking-wide shadow-glow-cyan active:scale-95 transition-all"
              >
                Submit Pilot Request
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-charcoal-850 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Smart Capture Automotive Photography. All rights reserved.</p>
        <p className="mt-1">
          Standalone SaaS for automotive inventory media management. First integration partner:
          D-Drive Auto.
        </p>
      </footer>
    </div>
  );
};
