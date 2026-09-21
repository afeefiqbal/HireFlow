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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchAnalytics(range);
  }, [range]); // fetchAnalytics is intentionally excluded — it reads range from args, not closure

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

  const conversion = analytics?.conversionMetrics || analytics?.conversions || {
    applicationRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
    interviewRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
    offerRate: { numerator: 0, denominator: 0, percentage: null, insufficientData: true },
  };

  const appRate = conversion.applicationRate || { numerator: 0, denominator: 0, percentage: null, insufficientData: true };
  const intRate = conversion.interviewRate || { numerator: 0, denominator: 0, percentage: null, insufficientData: true };
  const offRate = conversion.offerRate || { numerator: 0, denominator: 0, percentage: null, insufficientData: true };

  const timeMetrics = analytics?.timeMetrics || {
    avgDaysToApply: null,
    medianDaysToApply: null,
    avgDaysToInterview: null,
    medianDaysToInterview: null,
    avgDaysToOffer: null,
    medianDaysToOffer: null,
    insufficientData: true,
  };

  const breakdowns = analytics?.breakdowns;
  const sourceBreakdowns = breakdowns?.source || [];
  const roleFamilyBreakdowns = breakdowns?.roleFamily || [];
  const technologyBreakdowns = breakdowns?.technology || breakdowns?.technologies || [];
  const remoteBreakdowns = breakdowns?.remote || [];
  const visaBreakdowns = breakdowns?.visa || [];
  const freshnessBreakdowns = breakdowns?.freshness || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-[#00b074]" />
            Application Intelligence &amp; Analytics
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              V5 Deterministic Engine
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative PostgreSQL-backed funnel conversion, lifecycle timings, and factual pipeline distributions. Zero LLM calculations.
          </p>
        </div>

        {/* Date Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg shadow-2xs">
          {(['today', '7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                range === r
                  ? 'bg-[#00b074] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
          <button
            onClick={() => handleRangeChange('custom')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              range === 'custom'
                ? 'bg-[#00b074] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {range === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-xs shadow-xs">
          <span className="text-slate-600 font-medium">From:</span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#00b074]"
          />
          <span className="text-slate-600 font-medium">To:</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#00b074]"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 rounded-lg bg-[#00b074] text-white font-bold hover:bg-[#009a65] transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px]">Total Applied</span>
            <Send className="w-4 h-4 text-[#00b074]" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {funnel.applied}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Confirmed human submissions in window
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-purple-700">
            <span className="font-bold uppercase tracking-wider text-[11px]">Interviews</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-900 mt-2">
            {funnel.interview}
          </div>
          <div className="text-[11px] text-purple-700/80 mt-1">
            Active/completed interview stages
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span className="font-bold uppercase tracking-wider text-[11px]">Offers</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2">
            {funnel.offer}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1">
            Formal job offers received
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#009a65]">
            <span className="font-bold uppercase tracking-wider text-[11px]">Discovered Canonical</span>
            <Sparkles className="w-4 h-4 text-[#00b074]" />
          </div>
          <div className="text-3xl font-black text-emerald-950 mt-2">
            {funnel.discovered}
          </div>
          <div className="text-[11px] text-[#009a65]/80 mt-1">
            V4 Deduplicated canonical jobs
          </div>
        </div>
      </div>

      {/* Funnel & Conversion Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Lifecycle Funnel */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <TrendingUp className="w-4 h-4 text-[#00b074]" />
              Application Lifecycle Funnel
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {range === 'all' ? 'All Time' : `Window: ${range}`}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'Discovered', count: funnel.discovered, color: 'bg-slate-400', text: 'text-slate-700' },
              { label: 'Shortlisted', count: funnel.shortlisted, color: 'bg-sky-500', text: 'text-sky-700' },
              { label: 'Preparing', count: funnel.preparing, color: 'bg-blue-500', text: 'text-blue-700' },
              { label: 'Ready to Apply', count: funnel.readyToApply, color: 'bg-[#00b074]', text: 'text-[#009a65]' },
              { label: 'Applied', count: funnel.applied, color: 'bg-teal-600', text: 'text-teal-700' },
              { label: 'Interview', count: funnel.interview, color: 'bg-purple-500', text: 'text-purple-700' },
              { label: 'Offer', count: funnel.offer, color: 'bg-amber-500', text: 'text-amber-700' },
            ].map((step, idx) => {
              const maxVal = Math.max(funnel.discovered, 1);
              const pctOfDiscovered = Math.round((step.count / maxVal) * 100);

              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{step.label}</span>
                    <span className="font-bold text-slate-900">
                      {step.count}
                      <span className="text-[10px] text-slate-400 ml-1.5">({pctOfDiscovered}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(pctOfDiscovered, step.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
            Note: Discovered represents deduplicated job intake. Applications begin intentionally upon shortlisting or preparing.
          </div>
        </div>

        {/* Factual Conversion Rates Table */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileCheck2 className="w-4 h-4 text-[#00b074]" />
                Factual Conversion Metrics
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Zero Bias
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Application Rate */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Application Rate</span>
                  <span className="text-sm font-black text-[#009a65]">
                    {appRate.percentage != null
                      ? `${appRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Applied / Discovered</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {appRate.numerator} / {appRate.denominator}
                  </span>
                </div>
              </div>

              {/* Interview Rate */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Interview Rate</span>
                  <span className="text-sm font-black text-purple-700">
                    {intRate.percentage != null
                      ? `${intRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Interview / Applied</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {intRate.numerator} / {intRate.denominator}
                  </span>
                </div>
              </div>

              {/* Offer Rate */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Offer Rate</span>
                  <span className="text-sm font-black text-amber-700">
                    {offRate.percentage != null
                      ? `${offRate.percentage}%`
                      : 'Insufficient Data'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Offer / Applied</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {offRate.numerator} / {offRate.denominator}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2 mt-3">
            <Info className="w-4 h-4 text-[#00b074] shrink-0 mt-0.5" />
            <span>
              Conversion percentages are calculated strictly with zero-division guardrails. No artificial 0% is reported when the denominator is zero.
            </span>
          </div>
        </div>
      </div>

      {/* Time-to-Stage Timing Metrics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock className="w-4 h-4 text-indigo-600" />
            Lifecycle Duration Metrics (Days)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Calculated from authoritative timestamp differentials
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">Discovery → Apply</div>
            {timeMetrics.avgDaysToApply != null ? (
              <div>
                <div className="text-2xl font-black text-slate-900">{timeMetrics.avgDaysToApply} <span className="text-xs font-normal text-slate-500">days avg</span></div>
                <div className="text-[11px] text-slate-500 mt-1">Median: {timeMetrics.medianDaysToApply} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Insufficient timestamp data</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">Apply → Interview</div>
            {timeMetrics.avgDaysToInterview != null ? (
              <div>
                <div className="text-2xl font-black text-slate-900">{timeMetrics.avgDaysToInterview} <span className="text-xs font-normal text-slate-500">days avg</span></div>
                <div className="text-[11px] text-slate-500 mt-1">Median: {timeMetrics.medianDaysToInterview} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Insufficient timestamp data</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">Interview → Offer</div>
            {timeMetrics.avgDaysToOffer != null ? (
              <div>
                <div className="text-2xl font-black text-slate-900">{timeMetrics.avgDaysToOffer} <span className="text-xs font-normal text-slate-500">days avg</span></div>
                <div className="text-[11px] text-slate-500 mt-1">Median: {timeMetrics.medianDaysToOffer} days</div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Insufficient timestamp data</div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Distributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Building2 className="w-3.5 h-3.5 text-[#00b074]" />
            Job Source Distribution
          </div>
          <div className="space-y-2">
            {sourceBreakdowns.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {sourceBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No source data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Observed canonical postings by source adapter.
          </div>
        </div>

        {/* Role Family Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            Role Family Distribution
          </div>
          <div className="space-y-2">
            {roleFamilyBreakdowns.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {roleFamilyBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No role family data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Normalized role taxonomies.
          </div>
        </div>

        {/* Technology Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            Top Technologies (V4 Normalized)
          </div>
          <div className="space-y-2">
            {technologyBreakdowns.slice(0, 7).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {technologyBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No technology data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Factual counts in targeted positions.
          </div>
        </div>

        {/* Remote Setup Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Globe className="w-3.5 h-3.5 text-[#00b074]" />
            Workplace / Remote Distribution
          </div>
          <div className="space-y-2">
            {remoteBreakdowns.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {remoteBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No remote setup data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Evidence-extracted workplace policies.
          </div>
        </div>

        {/* Visa Policy Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
            Visa Policy Distribution
          </div>
          <div className="space-y-2">
            {visaBreakdowns.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {visaBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No visa data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Factual visa sponsorship policies stated.
          </div>
        </div>

        {/* Freshness Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Freshness Distribution at Discovery
          </div>
          <div className="space-y-2">
            {freshnessBreakdowns.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.key}</span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
            {freshnessBreakdowns.length === 0 && (
              <div className="text-xs text-slate-400 italic py-2">No freshness data</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Observed freshness buckets at discovery time.
          </div>
        </div>
      </div>
    </div>
  );
}
