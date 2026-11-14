
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Link2,
} from "lucide-react";

export default function IntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState("");

  async function checkConnection() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/integrations/facebook/pages",
        { credentials: "include" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to check connection");
      }

      setConnected(true);
      setPageCount(result.count || result.pages?.length || 0);
    } catch (err) {
      setConnected(false);
      setPageCount(0);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkConnection();

    const params = new URLSearchParams(window.location.search);
    const facebookStatus = params.get("facebook");

    if (facebookStatus === "connected") {
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-7">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect external platforms and manage your CRM integrations.
          </p>
        </div>

        {/* Integration card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Facebook Lead Ads
                </h2>
                <p className="text-sm text-gray-500">
                  Automatically bring Facebook leads into your CRM.
                </p>
              </div>
            </div>

            {loading ? (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Checking connection
              </span>
            ) : connected ? (
              <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                <AlertCircle size={16} />
                Not connected
              </span>
            )}
          </div>

          <div className="space-y-5 p-5 md:p-6">

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Connection
                </p>
                <p className="mt-2 font-semibold text-gray-900">
                  {loading
                    ? "Checking..."
                    : connected
                    ? "Active"
                    : "Not connected"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Connected Pages
                </p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {loading ? "—" : pageCount}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Lead synchronization
                </p>
                <p className="mt-2 font-semibold text-gray-900">
                  {connected ? "Ready to configure" : "Not configured"}
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {connected ? (
                <>
                  <a
                    href="/integration/facebook/forms"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Manage Facebook Forms
                    <ArrowRight size={16} />
                  </a>

                  <button
                    onClick={checkConnection}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </>
              ) : (
                <a
                  href="/api/integrations/facebook/connect"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
               
                  Connect Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              How integration works
            </h3>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Connect Facebook",
                description: "Authorize your Facebook account and access your Pages.",
              },
              {
                title: "Select Forms",
                description: "Choose Pages and Instant Forms from which you want leads.",
              },
              {
                title: "Configure Mapping",
                description: "Match form questions with CRM fields and set the default lead status.",
              },
            ].map((item, index) => (
              <div key={item.title} className="rounded-lg bg-gray-50 p-4">
                <span className="text-xs font-semibold text-blue-600">
                  STEP 0{index + 1}
                </span>
                <h4 className="mt-2 font-semibold text-gray-900">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
