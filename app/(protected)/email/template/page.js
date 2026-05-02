'use client'
import React, { useState, useEffect } from "react";
import { 
  Search, Filter, X, 
  AlertCircle, Eye, Send, Edit, Trash2,
  Monitor, Smartphone,
  PlusCircle
} from "lucide-react";
import Link from "next/link";

// --- CUSTOM HOOKS ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- API REQUESTER ---
const apiRequest = async (url, options = {}) => {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (res.status === 401 || res.status === 403) return { unauthorized: true };
    const data = await res.json();
    return { data, error: !res.ok };
  } catch (err) {
    console.error("API Error:", err);
    return { error: true, message: err.message };
  }
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Modals & Actions State
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sort, setSort] = useState("newest"); // newest | oldest | name
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [dateFilter, setDateFilter] = useState("All"); 
  const limit = 20;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter]);

  // --- API INTEGRATIONS ---

  // 1. Fetch Leads/Templates
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        sort,
        fromDate,
        toDate,
        ...(dateFilter !== "All" && { dateFilter })
      });

      const res = await apiRequest(`/api/email/template?${params.toString()}`);

      if (res.unauthorized) {
        setUnauthorized(true);
        return;
      }

      if (!res.error && res.data) {
        const payload = res.data;
        setLeads(payload.data || payload || []);
        setPages(payload.pages || 0);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, dateFilter, sort, fromDate, toDate]);

  
  // Handles MongoDB ObjectID format if it comes raw like { "$oid": "..." }
  const getLeadId = (lead) => typeof lead._id === 'object' && lead._id !== null ? lead._id.$oid : lead._id;

  // --- ACTION HANDLERS ---
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    
    // Call the dynamic DELETE route
    const res = await apiRequest(`/api/email/template/${deleteConfirmId}`, {
      method: "DELETE"
    });

    setIsDeleting(false);
    setDeleteConfirmId(null);

    if (!res.error) {
      // Refetch templates after successful deletion
      fetchLeads();
    } else {
      alert("Failed to delete the template. Please try again.");
    }
  };

  // HTML content generator for iframe safely containing user styles
  const getIframeSource = (template) => {
    const html = template?.compiledHtml || template?.body || template?.content || '<p style="color:gray; font-family:sans-serif; text-align:center; margin-top:20px;">No content available.</p>';
    const css = template?.compiledCss || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: sans-serif; }
            ${css}
          </style>
        </head>
        ${html}
      </html>
    `;
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your email templates.</p>
        </div>
        <Link
          href="/email/template/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          <PlusCircle size={18} />
          New Template
        </Link>
      </header>

      {/* Filters Bar */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 items-center shadow-sm z-10">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-8 relative">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">S.No.</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900">No templates found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, index) => {
                    const leadId = getLeadId(lead);
                    const parsedDate = typeof lead.createdAt === 'object' && lead.createdAt !== null 
                                       ? new Date(lead.createdAt.$date) 
                                       : new Date(lead.createdAt);

                    return (
                      <tr 
                        key={leadId} 
                        onClick={() => setSelectedLeadId(leadId)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{index+1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{lead.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{parsedDate.toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs mt-1">{parsedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {/* PREVIEW ICON */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPreviewTemplate(lead); }}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Preview Template"
                            >
                              <Eye size={18} />
                            </button>

                            {/* SEND ICON */}
                            <Link 
                              href={`/send-mail?templateId=${leadId}`}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="Send Email"
                            >
                              <Send size={18} />
                            </Link>

                            {/* EDIT ICON */}
                            <Link 
                              href={`/email/template/edit/${leadId}`}
                              className="text-gray-400 hover:text-amber-500 transition-colors"
                              title="Edit Template"
                            >
                              <Edit size={18} />
                            </Link>

                            {/* DELETE ICON */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(leadId); }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {!loading && pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-sm font-medium hover:bg-gray-50 transition-colors">Previous</button>
              <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-sm font-medium hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* 1. Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full h-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 truncate pr-4">Preview: {previewTemplate.name}</h2>
                {previewTemplate.subject && <p className="text-sm text-gray-500 truncate mt-0.5">Subject: {previewTemplate.subject}</p>}
              </div>
              
              <div className="flex items-center gap-4">
                {/* Desktop/Mobile Toggles */}
                <div className="flex items-center bg-gray-100/80 rounded-lg p-1 border border-gray-200/60">
                  <button 
                    onClick={() => setPreviewMode('desktop')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    title="Desktop View"
                  >
                    <Monitor size={16} /> Desktop
                  </button>
                  <button 
                    onClick={() => setPreviewMode('mobile')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    title="Mobile View"
                  >
                    <Smartphone size={16} /> Mobile
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-200"></div>

                <button 
                  onClick={() => { setPreviewTemplate(null); setPreviewMode('desktop'); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Close Preview"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            {/* Modal Body with Iframe */}
            <div className="flex-1 min-h-0 bg-slate-100/80 flex justify-center items-center p-4 sm:p-8 overflow-y-auto">
              <div 
                className={`transition-all duration-500 ease-in-out bg-white relative flex flex-col ${
                  previewMode === 'mobile' 
                    ? 'w-[375px] h-full shrink-0 rounded-[3rem] border-[14px] border-gray-900 shadow-2xl ring-1 ring-black/5' 
                    : 'w-full h-full rounded-xl border border-gray-200 shadow-sm'
                }`}
              >
                {/* Mobile Notch Mockup */}
                {previewMode === 'mobile' && (
                  <>
                    <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-2xl w-[140px] mx-auto z-10 pointer-events-none"></div>
                    <div className="absolute bottom-1.5 inset-x-0 h-1 bg-gray-300 rounded-full w-1/3 mx-auto z-10 pointer-events-none"></div>
                  </>
                )}
                
                <iframe
                  title="Email Preview"
                  srcDoc={getIframeSource(previewTemplate)}
                  className={`w-full h-full border-0 bg-white ${previewMode === 'mobile' ? 'rounded-b-[2rem] rounded-t-[2rem]' : 'rounded-xl'}`}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Template</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}