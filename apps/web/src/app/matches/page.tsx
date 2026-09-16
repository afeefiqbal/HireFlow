'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Job } from '@ai-job-agent/shared';
import { JobCard } from '@/components/JobCard';
import { Sparkles, ArrowRight, ShieldCheck, Filter } from 'lucide-react';

export default function MatchesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(80);

  const fetchMatches = async () => {
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
  };

  useEffect(() => {
    fetchMatches();
  }, [minScore]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-teal-400" />
            Curated Match Intelligence
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              {jobs.length} Strong Matches
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Jobs where technical stack, 7+ years seniority, location and visa alignment cross the threshold.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Threshold:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
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
            <div key={i} className="h-44 rounded-xl border border-slate-800 bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <h3 className="text-base font-semibold text-white">No jobs match the current threshold</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try lowering the threshold or run new AI analyses from the Discovery page.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500"
          >
            Explore Jobs Matrix
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
