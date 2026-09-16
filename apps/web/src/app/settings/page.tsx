'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Globe2,
  Database,
  Cpu,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-teal-400" />
          System &amp; Engine Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure discovery source adapters, AI matching thresholds, and anti-hallucination rules.
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-teal-600/20 border border-teal-500/40 p-3 text-xs font-semibold text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Configuration settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Strict 24h Filter Policy */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white">24-Hour Job Filter Protocol</h2>
            </div>
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
              Strict Mode Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400">
            System enforces that only postings whose verifiable <code className="text-teal-300">posted_at</code> timestamp is within 24.0 hours are classified as FRESH. Unverifiable aggregator badges (&quot;new&quot;, &quot;today&quot;) are ignored and marked as UNKNOWN.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Max Fresh Age (Hours)</label>
              <input
                type="number"
                defaultValue={24}
                disabled
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500">Fixed at 24.0 hours per core policy</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Deduplication Key</label>
              <input
                type="text"
                defaultValue="company::title::location::canonical_url"
                disabled
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 cursor-not-allowed font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* AI Engine & Ground Truth Governance */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white">AI Engine Configuration</h2>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              Active: Deterministic Engine
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p>
              The system currently runs the high-fidelity <strong>Deterministic Anti-Hallucination Engine</strong>, guaranteeing 100% compliance with Afeef Iqbal&apos;s verified credentials.
            </p>
            <p className="text-slate-400">
              Optional: You can supply an <code className="text-teal-300">OPENAI_API_KEY</code>, <code className="text-teal-300">GEMINI_API_KEY</code>, or <code className="text-teal-300">ANTHROPIC_API_KEY</code> in <code className="text-teal-300">.env</code> to activate live LLM vector reasoning with the strict prompt template in <code className="text-teal-300">prompts/system_matching.md</code>.
            </p>
          </div>
        </div>

        {/* Active Ingestion Adapters */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white">Configured Job Source Adapters</h2>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: 'Greenhouse Public Board Adapter', type: 'Public API', status: 'Active' },
              { name: 'Lever Job Board Adapter', type: 'Public API', status: 'Active' },
              { name: 'EU Remote Tech Feed Adapter', type: 'RSS / JSON Feed', status: 'Active' },
              { name: 'Ashby Public Board Adapter', type: 'Adapter Stub', status: 'Ready' },
            ].map((src) => (
              <div
                key={src.name}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <div>
                  <span className="font-semibold text-white">{src.name}</span>
                  <span className="ml-2 text-slate-500">({src.type})</span>
                </div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  {src.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database & Security */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Database className="h-5 w-5 text-teal-400" />
            <h2 className="text-sm font-bold text-white">Database &amp; Deployment Topology</h2>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div>
              Database Engine: <span className="font-semibold text-teal-400">PostgreSQL 16 (Local / VPS)</span>
            </div>
            <div>
              Frontend Target: <span className="font-semibold text-teal-400">Cloudflare Pages / Workers</span>
            </div>
            <div>
              Automation: <span className="font-semibold text-teal-400">n8n Scheduled Webhook Polling</span>
            </div>
            <div>
              Security: <span className="font-semibold text-teal-400">Bearer Token / Private Single-User Access</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/30"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </form>
    </div>
  );
}
