'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApplicationAnalytics } from '@ai-job-agent/shared';
import {
  BarChart3,
  Calendar,
  Clock,
  Briefcase,
  Layers,
  Send,
  Award,
  TrendingUp,
  Globe,
  Code2,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Flame,
  Building2,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedRange = range, from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getApplicationAnalytics(
        selectedRange,
        selectedRange === 'custom' ? from || customFrom : undefined,
        selectedRange === 'custom' ? to || customTo : undefined
      );
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const handleRangeChange = (newRange: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom') => {
    setRange(newRange);
    if (newRange !== 'custom') {
      fetchAnalytics(newRange);
    }
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    fetchAnalytics('custom', customFrom, customTo);
  };

  const funnel = analytics?.funnel || {
    discovered: 0,
    shortlisted: 0,
    preparing: 0,
    readyToApply: 0,
    applied: 0,
    interview: 0,
    offer: 0,
  };

  const conversion = analytics?.conversionMetrics || {
    applicationRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
    interviewRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
    offerRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
  };

  const timeMetrics = analytics?.timeMetrics || {
    avgDaysToApply: null,
    medianDaysToApply: null,
    avgDaysToInterview: null,
    medianDaysToInterview: null,
    avgDaysToOffer: null,
    medianDaysToOffer: null,
    insufficientData: true,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-teal-400" />
            Application Intelligence &amp; Analytics
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              V5 Deterministic Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative PostgreSQL-backed funnel conversion, lifecycle timings, and factual pipeline distributions. Zero LLM calculations.
          </p>
        </div>

        {/* Date Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          {(['today', '7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                range === r
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
          <button
            onClick={() => handleRangeChange('custom')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              range === 'custom'
                ? 'bg-teal-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {range === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
          <span className="text-slate-400 font-medium">From:</span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
          />
          <span className="text-slate-400 font-medium">To:</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 rounded bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Applied</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {funnel.applied}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Confirmed human submissions in window
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Interviews</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-200 mt-2">
            {funnel.interview}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">
            Active/completed interview stages
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Offers</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-200 mt-2">
            {funnel.offer}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Formal job offers received
          </div>
        </div>

        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-teal-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Discovered Canonical</span>
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-200 mt-2">
            {funnel.discovered}
          </div>
          <div className="text-[11px] text-teal-400/80 mt-1">
            V4 Deduplicated canonical jobs
          </div>
        </div>
      </div>

      {/* Funnel & Conversion Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Lifecycle Funnel */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0b1324] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Application Lifecycle Funnel
            </div>
            <span className="text-[11px] text-slate-500">
              {range === 'all' ? 'All Time' : `Window: ${range}`}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'Discovered', count: funnel.discovered, color: 'bg-slate-700', text: 'text-slate-300' },
              { label: 'Shortlisted', count: funnel.shortlisted, color: 'bg-sky-600', text: 'text-sky-300' },
              { label: 'Preparing', count: funnel.preparing, color: 'bg-blue-600', text: 'text-blue-300' },
              { label: 'Ready to Apply', count: funnel.readyToApply, color: 'bg-teal-600', text: 'text-teal-300' },
              { label: 'Applied', count: funnel.applied, color: 'bg-emerald-600', text: 'text-emerald-300' },
              { label: 'Interview', count: funnel.interview, color: 'bg-purple-600', text: 'text-purple-300' },
              { label: 'Offer', count: funnel.offer, color: 'bg-amber-500', text: 'text-amber-300' },
            ].map((step, idx) => {
              const maxVal = Math.max(funnel.discovered, 1);
              const pctOfDiscovered = Math.round((step.count / maxVal) * 100);

              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{step.label}</span>
                    <span className="font-bold text-white">
                      {step.count}
                      <span className="text-[10px] text-slate-500 ml-1.5">({pctOfDiscovered}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(pctOfDiscovered, step.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800/60">
            Note: Discovered represents deduplicated job intake. Applications begin intentionally upon shortlisting or preparing.
          </div>
        </div>

        {/* Factual Conversion Rates Table */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0b1324] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Factual Conversion Metrics
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Zero Bias
              </span>
            </div>

            <div className="space-y-4 pt-3">
              {/* Application Rate */}
              <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Application Rate</span>
                  <span className="text-sm font-black text-emerald-300">
                    {conversion.applicationRate.percentage != null
                      ? `${conversion.applicationRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Applied / Discovered</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {conversion.applicationRate.numerator} / {conversion.applicationRate.denominator}
                  </span>
                </div>
              </div>

              {/* Interview Rate */}
              <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Interview Rate</span>
                  <span className="text-sm font-black text-purple-300">
                    {conversion.interviewRate.percentage != null
                      ? `${conversion.interviewRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Interview / Applied</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {conversion.interviewRate.numerator} / {conversion.interviewRate.denominator}
                  </span>
                </div>
              </div>

              {/* Offer Rate */}
              <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Offer Rate</span>
                  <span className="text-sm font-black text-amber-300">
                    {conversion.offerRate.percentage != null
                      ? `${conversion.offerRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Offer / Applied</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {conversion.offerRate.numerator} / {conversion.offerRate.denominator}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              Conversion percentages are calculated strictly with zero-division guardrails. No artificial 0% is reported when the denominator is zero.
            </span>
          </div>
        </div>
      </div>

      {/* Time-to-Stage Timing Metrics */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Clock className="w-4 h-4 text-indigo-400" />
            Lifecycle Duration Metrics (Days)
          </div>
          <span className="text-[11px] text-slate-500">
            Calculated from authoritative timestamp differentials
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300">Discovery → Apply</div>
            {timeMetrics.avgDaysToApply != null ? (
              <div>
                <div className="text-2xl font-black text-white">{timeMetrics.avgDaysToApply} <span className="text-xs font-normal text-slate-400">days avg</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Median: {timeMetrics.medianDaysToApply} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2">Insufficient timestamp data</div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300">Apply → Interview</div>
            {timeMetrics.avgDaysToInterview != null ? (
              <div>
                <div className="text-2xl font-black text-white">{timeMetrics.avgDaysToInterview} <span className="text-xs font-normal text-slate-400">days avg</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Median: {timeMetrics.medianDaysToInterview} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2">Insufficient timestamp data</div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300">Interview → Offer</div>
            {timeMetrics.avgDaysToOffer != null ? (
              <div>
                <div className="text-2xl font-black text-white">{timeMetrics.avgDaysToOffer} <span className="text-xs font-normal text-slate-400">days avg</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Median: {timeMetrics.medianDaysToOffer} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2">Insufficient timestamp data</div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Distributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            Job Source Distribution
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.source || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.source || analytics.breakdowns.source.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No source data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Observed canonical postings by source adapter.
          </div>
        </div>

        {/* Role Family Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            Role Family Distribution
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.roleFamily || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.roleFamily || analytics.breakdowns.roleFamily.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No role family data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Normalized role taxonomies.
          </div>
        </div>

        {/* Technology Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            Top Technologies (V4 Normalized)
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.technology || []).slice(0, 7).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.technology || analytics.breakdowns.technology.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No technology data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Factual counts in targeted positions.
          </div>
        </div>

        {/* Remote Setup Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Workplace / Remote Distribution
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.remote || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.remote || analytics.breakdowns.remote.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No remote setup data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Evidence-extracted workplace policies.
          </div>
        </div>

        {/* Visa Policy Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            Visa Policy Distribution
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.visa || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.visa || analytics.breakdowns.visa.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No visa data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Factual visa sponsorship policies stated.
          </div>
        </div>

        {/* Freshness Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Freshness Distribution at Discovery
          </div>
          <div className="space-y-2">
            {(analytics?.breakdowns.freshness || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[140px]">{item.key}</span>
                <span className="font-semibold text-white">
                  {item.count} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {(!analytics?.breakdowns.freshness || analytics.breakdowns.freshness.length === 0) && (
              <div className="text-xs text-slate-500 italic py-2">No freshness data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Observed freshness buckets at discovery time.
          </div>
        </div>
      </div>
    </div>
  );
}
