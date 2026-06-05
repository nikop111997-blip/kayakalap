'use client'
import React, { useState, useEffect } from "react";
import { 
  Search, Filter, X, 
  Calendar, User, Phone, Mail, CheckCircle, 
  AlertCircle, Award, Target,
  IndianRupeeIcon, ShoppingBag, Paperclip, Activity
} from "lucide-react";

// --- CUSTOM HOOKS ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- MOCK API REQUESTER ---
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

// --- CONSTANTS ---
const GOALS = ["Journal", "Plans"];
const PROGRAMS = ["The Discipline Master", "pro_plan", "The Starter", "elite_plan", "platinum_plan", "Mentorship Bundle"];
const STATUSES = ["pending", "success", "failed"];

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [sort, setSort] = useState("newest"); // newest | oldest | name
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [goalFilter, setGoalFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, Last3, Last7, Last30
  const limit = 10;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, goalFilter, programFilter, dateFilter, sort, fromDate, toDate]);

  // --- API INTEGRATIONS ---
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      // Map sorting
      if (sort === "newest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "desc");
      } else if (sort === "oldest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "asc");
      } else if (sort === "name") {
        params.append("sortBy", "name");
        params.append("sortOrder", "asc");
      }

      // Map basic filters
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (goalFilter !== "All") params.append("product", goalFilter); // Route expects 'product'
      if (programFilter !== "All") params.append("plan", programFilter); // Route expects 'plan'

      // Map Date Filters
      let finalStartDate = fromDate;
      let finalEndDate = toDate;

      if (dateFilter !== "All") {
        const today = new Date();
        const start = new Date(today);

        if (dateFilter === "Today") {
          // start is already today
        } else if (dateFilter === "Last3") {
          start.setDate(today.getDate() - 3);
        } else if (dateFilter === "Last7") {
          start.setDate(today.getDate() - 7);
        } else if (dateFilter === "Last30") {
          start.setDate(today.getDate() - 30);
        }
        
        finalStartDate = start.toISOString().split('T')[0];
        finalEndDate = today.toISOString().split('T')[0];
      }

      if (finalStartDate) params.append("startDate", finalStartDate);
      if (finalEndDate) params.append("endDate", finalEndDate);

      const res = await apiRequest(`/api/orders?${params.toString()}`);

      if (res.unauthorized) {
        setUnauthorized(true);
        return;
      }

      if (!res.error && res.data) {
        setLeads(res.data.data || []);
        setPages(res.data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter, goalFilter, programFilter, dateFilter, sort, fromDate, toDate]);

  // --- HELPERS ---
  const getLeadId = (lead) => typeof lead._id === 'object' && lead._id !== null ? lead._id.$oid : lead._id;

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "success": return "bg-emerald-100 text-emerald-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const selectedLead = leads.find(l => getLeadId(l) === selectedLeadId);

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
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your orders and conversions.</p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 items-center shadow-sm z-10">
        
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, phone, or payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <select 
            value={dateFilter} 
            onChange={(e) => {
              setDateFilter(e.target.value);
              setFromDate("");
              setToDate("");
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Last3">Last 3 Days</option>
            <option value="Last7">Last 7 Days</option>
            <option value="Last30">Last 30 Days</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setDateFilter("All");
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setDateFilter("All");
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={programFilter} 
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Programs</option>
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={goalFilter} 
            onChange={(e) => setGoalFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-[200px]"
          >
            <option value="All">All Types</option>
            {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
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
                  <th className="px-6 py-4">Name & Contact</th>
                  <th className="px-6 py-4">Program & Goal</th>
                  <th className="px-6 py-4">Payment Info</th>
                  <th className="px-6 py-4">Order Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-3 bg-gray-200 rounded w-3/4"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900">No orders found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const leadId = getLeadId(lead);
                    const parsedDate = new Date(lead.createdAt?.$date || lead.createdAt);

                    return (
                      <tr 
                        key={leadId} 
                        onClick={() => setSelectedLeadId(leadId)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{lead.name}</div>
                          <div className="text-gray-500 text-xs mt-1">{lead.email}</div>
                          <div className="text-gray-500 text-xs">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{lead.plan}</div>
                          <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">{lead.product ? "Journal/Bundle" : "Plan Only"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 flex items-center"><IndianRupeeIcon size={14} /> {lead.amount}</div>
                          <div className="text-gray-500 text-xs mt-1">Qty: {lead.quantity || 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{parsedDate.toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {parsedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                            {lead.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- SIDEBAR (Lead Details) --- */}
      {selectedLead && (
        <>
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedLeadId(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform flex flex-col border-l border-gray-200">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button 
                onClick={() => setSelectedLeadId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h3>
                <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedLead.status)}`}>
                  Status: {selectedLead.status || "Unknown"}
                </span>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={16} className="mr-3 text-gray-400" />
                    <a href={`mailto:${selectedLead.email}`} className="hover:text-blue-600">{selectedLead.email}</a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={16} className="mr-3 text-gray-400" />
                    <p>{selectedLead.phone}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ShoppingBag size={16} className="mr-3 text-gray-400" />
                    <span className="font-medium">{selectedLead.plan}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-3 text-gray-400" />
                    <span>
                      {selectedLead.createdAt && new Date(selectedLead.createdAt?.$date || selectedLead.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Payment Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center"><IndianRupeeIcon size={16} className="mr-2 text-gray-500" /> Payment Details</h4>
                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium text-gray-900">₹{selectedLead.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium text-gray-900">{selectedLead.quantity || 1}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-gray-500 mb-1">Payment Request ID:</span>
                    <span className="font-mono text-xs text-gray-900 break-all">{selectedLead.paymentRequestId || "N/A"}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-gray-500 mb-1">Payment URL:</span>
                    <a href={selectedLead.paymentUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-600 hover:underline break-all">
                      {selectedLead.paymentUrl || "N/A"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address details if product exists */}
              {selectedLead.product && selectedLead.customer && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center"><Target size={16} className="mr-2 text-gray-500" /> Shipping Address</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {selectedLead.customer.address ? (
                        <>
                          <p>{selectedLead.customer.address}</p>
                          <p>{selectedLead.customer.city}, {selectedLead.customer.pincode}</p>
                        </>
                      ) : (
                        <p className="italic text-gray-400">No address provided</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Marketing & UTM Tracking */}
              <hr className="border-gray-100" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center"><Activity size={16} className="mr-2 text-gray-500" /> Tracking & UTM</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="col-span-2">
                    <span className="block text-xs text-gray-500">Referred By:</span>
                    <span className="font-medium text-gray-900">{selectedLead.refferBy || "Direct / Unknown"}</span>
                  </div>
                  
                  {selectedLead.utm && (
                    <>
                      <div>
                        <span className="block text-xs text-gray-500">Source:</span>
                        <span className="font-medium text-gray-900">{selectedLead.utm.utm_source || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Medium:</span>
                        <span className="font-medium text-gray-900">{selectedLead.utm.utm_medium || "-"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs text-gray-500">Campaign:</span>
                        <span className="font-medium text-gray-900">{selectedLead.utm.utm_campaign || "-"}</span>
                      </div>
                    </>
                  )}
                  
                  {selectedLead.landingPage && (
                    <div className="col-span-2 mt-2 border-t border-gray-200 pt-2">
                      <span className="block text-xs text-gray-500 mb-1">Landing Page:</span>
                      <a href={selectedLead.landingPage} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                        {selectedLead.landingPage}
                      </a>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}