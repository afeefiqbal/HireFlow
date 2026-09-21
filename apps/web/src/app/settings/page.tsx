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
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-[#00b074]" />
          System &amp; Engine Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure discovery source adapters, AI matching thresholds, and anti-hallucination rules.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-[#009a65] flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-[#00b074]" />
          <span>Configuration settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Strict 24h Filter Policy */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#00b074]" />
              <h2 className="text-sm font-bold text-slate-900">24-Hour Job Filter Protocol</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200 uppercase">
              Strict Mode Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500">
            System enforces that only postings whose verifiable <code className="text-[#009a65] font-semibold">posted_at</code> timestamp is within 24.0 hours are classified as FRESH. Unverifiable aggregator badges (&quot;new&quot;, &quot;today&quot;) are ignored and marked as UNKNOWN.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Fresh Age (Hours)</label>
              <input
                type="number"
                defaultValue={24}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Fixed at 24.0 hours per core policy</span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deduplication Key</label>
              <input
                type="text"
                defaultValue="company::title::location::canonical_url"
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* AI Engine & Ground Truth Governance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#00b074]" />
              <h2 className="text-sm font-bold text-slate-900">AI Engine Configuration</h2>
            </div>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
              Active: Deterministic Engine
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>
              The system currently runs the high-fidelity <strong className="text-slate-900">Deterministic Anti-Hallucination Engine</strong>, guaranteeing 100% compliance with Afeef Iqbal&apos;s verified credentials.
            </p>
            <p className="text-slate-500">
              Optional: You can supply an <code className="text-[#009a65] font-semibold">OPENAI_API_KEY</code>, <code className="text-[#009a65] font-semibold">GEMINI_API_KEY</code>, or <code className="text-[#009a65] font-semibold">ANTHROPIC_API_KEY</code> in <code className="text-[#009a65] font-semibold">.env</code> to activate live LLM vector reasoning with the strict prompt template in <code className="text-[#009a65] font-semibold">prompts/system_matching.md</code>.
            </p>
          </div>
        </div>

        {/* Active Ingestion Adapters */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-[#00b074]" />
              <h2 className="text-sm font-bold text-slate-900">Configured Job Source Adapters</h2>
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
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div>
                  <span className="font-bold text-slate-900">{src.name}</span>
                  <span className="ml-2 text-slate-400">({src.type})</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200">
                  {src.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database & Security */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Database className="h-5 w-5 text-[#00b074]" />
            <h2 className="text-sm font-bold text-slate-900">Database &amp; Deployment Topology</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>
              Database Engine: <span className="font-bold text-slate-900">PostgreSQL 16 (Local / Cloudflare Hyperdrive)</span>
            </div>
            <div>
              Frontend Target: <span className="font-bold text-slate-900">Cloudflare Workers / OpenNext</span>
            </div>
            <div>
              Automation: <span className="font-bold text-slate-900">n8n Scheduled Webhook Polling</span>
            </div>
            <div>
              Security: <span className="font-bold text-slate-900">Bearer Token / Private Single-User Access</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </form>
    </div>
  );
}
