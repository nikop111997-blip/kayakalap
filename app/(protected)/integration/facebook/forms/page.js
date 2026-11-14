"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  Loader2,
  ChevronRight,
  Search,
  AlertCircle,
  Settings2,
  Building2,
  Hash,
  Plug,
  CircleDot,
} from "lucide-react";

const PAGE_ID = "249659368570089";
const PAGE_NAME = "Kayapalat Wellness";

/* Notion palette */
const INK = "text-[#37352f]";
const MUTED = "text-[#787774]";
const FAINT = "text-[#9b9a97]";
const LINE = "border-[rgba(55,53,47,0.09)]";
const HOVER = "hover:bg-[rgba(55,53,47,0.06)]";

function Tag({ active, children }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-[1px] text-[12px] leading-5 ${
        active
          ? "bg-[#dbeddb] text-[#1c3829]"
          : "bg-[#e3e2e0] text-[#32302c]"
      }`}
    >
      {children}
    </span>
  );
}

function Property({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center py-[3px] text-[14px]">
      <div className={`flex w-40 shrink-0 items-center gap-2 ${MUTED}`}>
        <Icon size={15} strokeWidth={1.8} />
        {label}
      </div>
      <div className={INK}>{children}</div>
    </div>
  );
}

export default function FacebookFormsPage() {
  const [page, setPage] = useState(null);
  const [forms, setForms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadForms() {
    try {
      setLoadingForms(true);
      setError("");

      const response = await fetch(
        `/api/integrations/facebook/forms?pageId=${PAGE_ID}`,
        { credentials: "include" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load forms");
      }

      setPage({
        id: PAGE_ID,
        name: PAGE_NAME,
      });

      setForms(result.forms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingForms(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  const filteredForms = forms.filter((form) =>
    form.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeForms = forms.filter((form) => form.status === "ACTIVE").length;

  const totalLeads = forms.reduce(
    (total, form) => total + (Number(form.leads_count) || 0),
    0
  );

  return (
    <div
      className={`min-h-screen bg-white ${INK}`}
     
    >
      <div className="mx-auto px-6 pb-32 pt-8 md:px-8">
        {/* Breadcrumb */}
        <nav
          className={`mb-4 flex items-center gap-1 text-[14px] ${MUTED}`}
          aria-label="Breadcrumb"
        >
          <Link
            href="/integration"
            className={`rounded px-1.5 py-0.5 transition-colors ${HOVER}`}
          >
            Integrations
          </Link>
          <ChevronRight size={14} className={FAINT} />
          <span className={`rounded px-1.5 py-0.5 ${INK}`}>
            Facebook Lead Forms
          </span>

          <button
            onClick={loadForms}
            disabled={loadingForms}
            className={`ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2383e2] disabled:opacity-50 ${HOVER}`}
          >
            <RefreshCw
              size={14}
              className={loadingForms ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </nav>
        <h1 className=" text-[40px] font-bold leading-[1.2] tracking-[-0.01em]">
          Facebook Lead Forms
        </h1>

        <p className={`mt-2 text-[16px] leading-6 ${MUTED}`}>
          Instant Forms from your Facebook Page. Open a form to map its fields
          to your CRM.
        </p>

        {/* Properties */}
        <div className={`mt-6 border-b pb-5 ${LINE}`}>
          <Property icon={Building2} label="Page">
            {PAGE_NAME}
          </Property>
          <Property icon={Hash} label="Page ID">
            <span className="font-mono text-[13px]">{PAGE_ID}</span>
          </Property>
          <Property icon={Plug} label="Integration">
            Facebook Lead Ads
          </Property>
          <Property icon={CircleDot} label="Status">
            <Tag active>Connected</Tag>
          </Property>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded bg-[#fdebec] px-3.5 py-3 text-[14px] text-[#5d1715]">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Couldn’t load forms</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Summary line */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px]">
          <span className={MUTED}>
            Forms{" "}
            <span className={`font-medium ${INK}`}>
              {loading ? "–" : forms.length}
            </span>
          </span>
          <span className={MUTED}>
            Active{" "}
            <span className={`font-medium ${INK}`}>
              {loading ? "–" : activeForms}
            </span>
          </span>
          <span className={MUTED}>
            Leads{" "}
            <span className={`font-medium ${INK}`}>
              {loading ? "–" : totalLeads}
            </span>
          </span>
        </div>

        {/* Database toolbar */}
        <div
          className={`mt-3 flex items-center justify-between gap-3 border-b pb-2 ${LINE}`}
        >
          <div className="flex items-center gap-2 text-[14px] font-medium">
            <FileText size={16} className={MUTED} />
            Instant forms
          </div>

          <div className="relative w-full max-w-[220px]">
            <Search
              size={14}
              className={`absolute left-2 top-1/2 -translate-y-1/2 ${FAINT}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forms"
              aria-label="Search forms"
              className="w-full rounded bg-[rgba(55,53,47,0.05)] py-1 pl-7 pr-2 text-[14px] outline-none transition placeholder:text-[#9b9a97] focus:bg-white focus:ring-2 focus:ring-[#2383e2]"
            />
          </div>
        </div>

        {/* Table header */}
        <div
          className={`hidden grid-cols-[minmax(0,1fr)_90px_70px_100px_32px] items-center gap-3 border-b px-1 py-1.5 text-[12px] sm:grid ${LINE} ${MUTED}`}
        >
          <span>Name</span>
          <span>Status</span>
          <span>Leads</span>
          <span>Created</span>
          <span />
        </div>

        {/* Rows */}
        {loading ? (
          <div className={`flex items-center gap-2 px-1 py-6 text-[14px] ${MUTED}`}>
            <Loader2 size={16} className="animate-spin" />
            Loading forms…
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="px-1 py-10 text-[14px]">
            <p className="font-medium">No forms found</p>
            <p className={`mt-1 ${MUTED}`}>
              {search
                ? "Try a different search term."
                : `${PAGE_NAME} has no Instant Forms yet. Create one in Meta Ads Manager, then select Refresh.`}
            </p>
          </div>
        ) : (
          <ul>
            {filteredForms.map((form) => (
              <li key={form.id}>
                <Link
                  href={`/integration/facebook/forms/${encodeURIComponent(
                    form.id
                  )}/mapping?pageId=${PAGE_ID}`}
                  className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-1 py-2 text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2383e2] sm:grid-cols-[minmax(0,1fr)_90px_70px_100px_32px] ${LINE} ${HOVER}`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText
                      size={17}
                      strokeWidth={1.8}
                      className={`shrink-0 ${MUTED}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium underline decoration-[rgba(55,53,47,0.2)] decoration-1 underline-offset-2 group-hover:decoration-[rgba(55,53,47,0.5)]">
                        {form.name}
                      </p>
                      <p className={`truncate text-[12px] ${FAINT}`}>
                        {form.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:contents">
                    <span className="sm:block">
                      <Tag active={form.status === "ACTIVE"}>
                        {form.status
                          ? form.status.charAt(0) +
                            form.status.slice(1).toLowerCase()
                          : "Unknown"}
                      </Tag>
                    </span>

                    <span className="tabular-nums">
                      {form.leads_count || 0}
                      <span className={`ml-1 sm:hidden ${MUTED}`}>leads</span>
                    </span>

                    <span className={`hidden sm:block ${MUTED}`}>
                      {form.created_time
                        ? new Date(form.created_time).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <span
                    className={`hidden justify-self-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block ${MUTED}`}
                    title="Configure mapping"
                  >
                    <Settings2 size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className={`mt-3 px-1 text-[13px] ${FAINT}`}>
          Select a form to configure its CRM field mapping.
        </p>
      </div>
    </div>
  );
}