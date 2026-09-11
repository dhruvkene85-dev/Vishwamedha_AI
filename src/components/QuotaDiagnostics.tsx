import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Gauge, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

export interface QuotaTelemetry {
  remainingRequests: string | null;
  limitRequests: string | null;
  remainingTokens: string | null;
  limitTokens: string | null;
  resetTokens: string | null;
  resetRequests: string | null;
  lastUpdated: number | null;
}

export interface QuotasPayload {
  activeProvider: string;
  groq: {
    configured: boolean;
    model: string;
    telemetryType: 'live_headers';
    telemetry: QuotaTelemetry;
    publishedLimits: {
      note: string;
      requestsPerDay: string;
      tokensPerMinute: string;
    };
    dashboardUrl: string;
  };
  gemini: {
    configured: boolean;
    model: string;
    telemetryType: 'published_specs';
    publishedLimits: {
      rpm: number;
      rpd: number;
      tpm: number;
      note: string;
    };
    dashboardUrl: string;
  };
  nvidia: {
    configured: boolean;
    model: string;
    telemetryType: 'published_specs';
    publishedLimits: {
      rpm: number;
      note: string;
    };
    dashboardUrl: string;
  };
  sessionMetrics: {
    totalRequests: number;
    groqRequests: number;
    nvidiaRequests: number;
    geminiRequests: number;
    startTime: number;
  };
}

function parseResetToSeconds(resetStr: string | null): number {
  if (!resetStr) return 0;
  let totalSec = 0;
  const dMatch = resetStr.match(/(\d+(?:\.\d+)?)d/);
  if (dMatch) totalSec += parseFloat(dMatch[1]) * 86400;
  const hMatch = resetStr.match(/(\d+(?:\.\d+)?)h/);
  if (hMatch) totalSec += parseFloat(hMatch[1]) * 3600;
  const mMatch = resetStr.match(/(\d+(?:\.\d+)?)m(?!s)/);
  if (mMatch) totalSec += parseFloat(mMatch[1]) * 60;
  const msMatch = resetStr.match(/(\d+(?:\.\d+)?)ms/);
  if (msMatch) totalSec += parseFloat(msMatch[1]) / 1000;
  const withoutMs = resetStr.replace(/(\d+(?:\.\d+)?)ms/g, '');
  const sMatch = withoutMs.match(/(\d+(?:\.\d+)?)s/);
  if (sMatch) totalSec += parseFloat(sMatch[1]);
  if (!dMatch && !hMatch && !mMatch && !msMatch && !sMatch) {
    const rawNum = parseFloat(resetStr);
    if (!isNaN(rawNum)) totalSec = rawNum;
  }
  return totalSec;
}

export const QuotaDiagnostics: React.FC = () => {
  const [data, setData] = useState<QuotasPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState<number>(Date.now());

  // 1-second ticker for real-time local countdown and quota restoration
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuotas = async (probe: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = probe ? '/api/quotas?probe=true' : '/api/quotas';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: QuotasPayload = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch quota telemetry:', err);
      setError('Could not reach /api/quotas telemetry endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchQuotas(false);
    // Background polling every 30 seconds
    const interval = setInterval(() => fetchQuotas(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute real-time live recovery for Groq tokens and requests based on elapsed time
  const groqLive = useMemo(() => {
    const telemetry = data?.groq.telemetry;
    if (!telemetry || !telemetry.lastUpdated) {
      return {
        remainingTokens: telemetry?.remainingTokens ?? '8,000',
        limitTokens: telemetry?.limitTokens ?? '8,000',
        remainingRequests: telemetry?.remainingRequests ?? '14,400',
        limitRequests: telemetry?.limitRequests ?? '14,400',
        resetTokensText: telemetry?.resetTokens || '60s',
        tokPct: 100,
        reqPct: 100,
        isFullyReset: false,
        hasSampled: false,
      };
    }

    const elapsedSec = Math.max(0, (clock - telemetry.lastUpdated) / 1000);
    const tokenResetSec = parseResetToSeconds(telemetry.resetTokens);
    const requestResetSec = parseResetToSeconds(telemetry.resetRequests);

    const limitTok = parseFloat(telemetry.limitTokens || '8000') || 8000;
    const remTok = parseFloat(telemetry.remainingTokens || String(limitTok)) || limitTok;

    let liveRemTok = remTok;
    let resetTokensText = telemetry.resetTokens || '0s';
    let isFullyReset = false;

    if (tokenResetSec <= 0 || elapsedSec >= tokenResetSec) {
      liveRemTok = limitTok;
      resetTokensText = '0s (Restored)';
      isFullyReset = true;
    } else {
      const ratio = elapsedSec / tokenResetSec;
      liveRemTok = Math.min(limitTok, Math.round(remTok + (limitTok - remTok) * ratio));
      const remainingSec = Math.max(0, tokenResetSec - elapsedSec);
      resetTokensText = `${remainingSec.toFixed(1)}s`;
    }

    const limitReq = parseFloat(telemetry.limitRequests || '14400') || 14400;
    const remReq = parseFloat(telemetry.remainingRequests || String(limitReq)) || limitReq;

    let liveRemReq = remReq;
    if (requestResetSec <= 0 || elapsedSec >= requestResetSec) {
      liveRemReq = limitReq;
    } else {
      const reqRatio = elapsedSec / requestResetSec;
      liveRemReq = Math.min(limitReq, Math.round(remReq + (limitReq - remReq) * reqRatio));
    }

    const tokPct = Math.min(100, Math.max(0, Math.round((liveRemTok / limitTok) * 100)));
    const reqPct = Math.min(100, Math.max(0, Math.round((liveRemReq / limitReq) * 100)));

    return {
      remainingTokens: liveRemTok.toLocaleString(),
      limitTokens: limitTok.toLocaleString(),
      remainingRequests: liveRemReq.toLocaleString(),
      limitRequests: limitReq.toLocaleString(),
      resetTokensText,
      tokPct,
      reqPct,
      isFullyReset,
      hasSampled: true,
    };
  }, [data, clock]);

  const formatUptime = (startTime: number) => {
    const elapsedSec = Math.max(0, Math.floor((clock - startTime) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-indigo-600">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              API Quotas, Rate Limits & Telemetry
              {data && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case">
                  Live
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Live HTTP rate-limit telemetry from inference providers and session request metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchQuotas(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition disabled:opacity-50 cursor-pointer"
            title="Probe and refresh live API quotas from providers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isLoading ? 'Probing...' : 'Refresh Quotas'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Groq Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-50/40 to-slate-50/70 border border-orange-200/70 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-200 animate-pulse" />
              <span className="font-bold text-slate-900 text-xs">Groq LPU Engine</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              Live HTTP Headers
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Requests (RPD) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span>Daily Requests</span>
                <span className="font-bold text-slate-800">
                  {groqLive.remainingRequests} / {groqLive.limitRequests}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${groqLive.reqPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                {groqLive.hasSampled ? `${groqLive.reqPct}% remaining` : 'Default Free Tier quota'}
              </div>
            </div>

            {/* Tokens per minute (TPM) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span>Tokens / Min</span>
                <span className="font-bold text-slate-800">
                  {groqLive.remainingTokens} / {groqLive.limitTokens}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    groqLive.isFullyReset ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} 
                  style={{ width: `${groqLive.tokPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className={groqLive.isFullyReset ? 'text-emerald-600 font-semibold' : ''}>
                  Reset: {groqLive.resetTokensText}
                </span>
                <span className={groqLive.isFullyReset ? 'text-emerald-600 font-semibold' : ''}>
                  {groqLive.isFullyReset ? '100% (Restored)' : `${groqLive.tokPct}% remaining`}
                </span>
              </div>
            </div>

            {groqLive.hasSampled ? (
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 pt-1 border-t border-orange-100">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Real-time header interception active</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 pt-1 border-t border-orange-100">
                <span>Click &quot;Refresh Quotas&quot; or send a chat to sample live headers</span>
              </div>
            )}
          </div>

          <a
            href={data?.groq.dashboardUrl || 'https://console.groq.com/settings/limits'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center justify-between pt-1 group"
          >
            <span>Groq Rate Limits Console</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* 2. Google AI Studio (Gemini) Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/40 to-slate-50/70 border border-blue-200/70 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${data?.gemini.configured ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <span className="font-bold text-slate-900 text-xs">Google Gemini AI</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Published Specs
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white border border-blue-100 text-center">
                <div className="text-base font-extrabold text-blue-600">15</div>
                <div className="text-[10px] text-slate-500 font-medium">Req / Minute</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-blue-100 text-center">
                <div className="text-base font-extrabold text-blue-600">1,500</div>
                <div className="text-[10px] text-slate-500 font-medium">Req / Day</div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-blue-100 text-center">
              <div className="text-sm font-extrabold text-blue-600">1,000,000 TPM</div>
              <div className="text-[10px] text-slate-500 font-medium">Free Tier Tokens / Min</div>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Google AI Studio returns limits on HTTP 429 Retry-After. Standard free tier limits shown.
            </p>
          </div>

          <a
            href={data?.gemini.dashboardUrl || 'https://aistudio.google.com/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between pt-1 group"
          >
            <span>Google AI Studio Console</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* 3. NVIDIA NIM Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/40 to-slate-50/70 border border-emerald-200/70 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${data?.nvidia.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="font-bold text-slate-900 text-xs">NVIDIA NIM API</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              NIM Developer Tier
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-white border border-emerald-100 text-center">
              <div className="text-xl font-extrabold text-emerald-600">40 RPM</div>
              <div className="text-[10px] text-slate-500 font-medium">Requests Per Minute Cap</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[10px] text-slate-600 leading-relaxed">
              Enforced across Nemotron, Llama 3.2 Vision, and Muse models on build.nvidia.com trial credits.
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Resets automatically per 60-second window</span>
            </div>
          </div>

          <a
            href={data?.nvidia.dashboardUrl || 'https://build.nvidia.com/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between pt-1 group"
          >
            <span>NVIDIA Build Console</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Session Diagnostics & Metrics */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Session Inference Activity</span>
          </div>
          {data?.sessionMetrics && (
            <span className="text-[10px] text-slate-500 font-medium">
              Uptime: {formatUptime(data.sessionMetrics.startTime)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Queries</div>
            <div className="text-base font-extrabold text-slate-800">
              {data?.sessionMetrics.totalRequests ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
            <div className="text-[10px] text-orange-500 font-semibold uppercase">Groq Requests</div>
            <div className="text-base font-extrabold text-orange-600">
              {data?.sessionMetrics.groqRequests ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
            <div className="text-[10px] text-emerald-600 font-semibold uppercase">NVIDIA Requests</div>
            <div className="text-base font-extrabold text-emerald-600">
              {data?.sessionMetrics.nvidiaRequests ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
            <div className="text-[10px] text-blue-600 font-semibold uppercase">Gemini Requests</div>
            <div className="text-base font-extrabold text-blue-600">
              {data?.sessionMetrics.geminiRequests ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
