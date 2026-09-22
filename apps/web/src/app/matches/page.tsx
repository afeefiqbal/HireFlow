'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Job } from '@ai-job-agent/shared';
import { JobCard } from '@/components/JobCard';
import { Sparkles, ArrowRight, ShieldCheck, Filter } from 'lucide-react';

export default function MatchesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(75);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({
        minMatchScore: minScore,
        freshOnly: false,
      });
      setJobs(res.jobs || []);
    } catch (err: any) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [minScore]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#00b074]" />
            Curated Match Intelligence
            <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              {jobs.length} Strong Matches
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">

          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Threshold:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00b074] focus:outline-none shadow-2xs"
          >
            <option value={75}>≥ 75% Compatible</option>
            <option value={80}>≥ 80% Recommended</option>
            <option value={85}>≥ 85% High Match</option>
            <option value={90}>≥ 90% Exceptional Fit</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-slate-200 bg-white p-5 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-xs">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No jobs match the current threshold</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try lowering the threshold or run continuous discovery to ingest fresh postings.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
          >
            <span>Explore Jobs Matrix</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
