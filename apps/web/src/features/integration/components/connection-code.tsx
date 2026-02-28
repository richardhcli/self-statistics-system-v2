
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase/services';
import { Copy, RefreshCw, AlertTriangle, Check, Smartphone } from 'lucide-react';

/**
 * Component: ConnectionCode
 *
 * Generates a one-time Firebase Custom Token ("Connection Code") that
 * external clients (Obsidian plugin, CLI tools) exchange for a permanent
 * session via Google's Identity Toolkit REST API.
 *
 * The token is valid for 60 minutes. It is never persisted — it lives
 * only in local React state and vanishes when the component unmounts or
 * the user clicks "Close & Clear".
 *
 * @see docs/dev/authentication/api-authentication-pipeline.md
 */
export const ConnectionCode: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const fn = httpsCallable<Record<string, never>, { token: string }>(
        functions,
        'generateFirebaseAccessToken',
      );
      const result = await fn();
      setToken(result.data.token);
    } catch (err) {
      console.error('Failed to generate connection code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Connect External App</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Firebase Custom Token Auth
          </p>
        </div>
      </div>

      {!token ? (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Generate a secure, one-time connection code. Paste this code into
            your external app (like Obsidian) to log it in permanently.
          </p>
          <button
            onClick={generateToken}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Generate Connection Code
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                  One-Time Connection Code
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  This code expires in 60 minutes. Copy it now — it will not be
                  shown again.
                </p>
              </div>

              <div className="flex items-stretch gap-0 rounded-xl shadow-sm overflow-hidden border border-amber-300">
                <code className="flex-1 p-3 bg-white font-mono text-xs text-slate-600 break-all select-all block max-h-24 overflow-y-auto">
                  {token}
                </code>
                <button
                  onClick={handleCopy}
                  className="px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 border-l border-amber-300 transition-colors flex items-center justify-center"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <button
                onClick={() => setToken(null)}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                Close &amp; Clear Code
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
