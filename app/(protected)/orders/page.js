'use client'
import React, { useState, useEffect } from "react";
import { 
  Search, Filter, X, 
  Calendar, User, Phone, Mail, CheckCircle, 
 AlertCircle, Award,

  IndianRupeeIcon,
  ShoppingBag,
  Paperclip
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
// Replace this with: import { apiRequest } from "@/lib/api" in your actual project
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
const GOALS = [
  "Journal",
  "Plans"
];

const PROGRAMS = ["The Discipline Master", "pro_plan", "The Starter", "elite_plan", "platinum_plan" ];

const STATUSES = [
  "pending", 
  "success", 
  "failed", 
];

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Modals
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
const [sort, setSort] = useState("newest") // newest | oldest | name
const [fromDate, setFromDate] = useState("")
const [toDate, setToDate] = useState("")
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [goalFilter, setGoalFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, Last3, Last7, Last30
  const limit = 10;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, goalFilter, programFilter, dateFilter]);

  // --- API INTEGRATIONS ---

  // 1. Fetch Leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Build Query String
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        sort,
  fromDate,
  toDate,
        ...(statusFilter !== "All" && { status: statusFilter }),
        ...(goalFilter !== "All" && { goal: goalFilter }),
        ...(programFilter !== "All" && { program: programFilter }),
        ...(dateFilter !== "All" && { dateFilter })
      });

      const res = await apiRequest(`/api/orders?${params.toString()}`);

      if (res.unauthorized) {
        setUnauthorized(true);
        return;
      }

      if (!res.error && res.data) {
        // Adjust depending on your backend response structure
        const payload = res.data;
        setLeads(payload.data || payload || []);
        setPages(payload.pages || 0);
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


  // 5. Import CSV

  // --- HELPERS ---
  
  // Handles MongoDB ObjectID format if it comes raw like { "$oid": "..." }
  const getLeadId = (lead) => typeof lead._id === 'object' && lead._id !== null ? lead._id.$oid : lead._id;

  const getStatusColor = (status) => {
    switch(status) {
      case "New": return "bg-blue-100 text-blue-800";
      case "Interested": return "bg-green-100 text-green-800";
      case "Converted": return "bg-emerald-100 text-emerald-800";
      case "Call Back": return "bg-yellow-100 text-yellow-800";
      case "Not Interested": return "bg-gray-100 text-gray-800";
      case "Invalid": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Derived Data
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
          <p className="text-sm text-gray-500 mt-1">Manage and track your orders.</p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 items-center shadow-sm z-10">
  
  {/* 🔍 Search */}
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

    {/* 📅 Quick Date Filter */}
    <select 
      value={dateFilter} 
      onChange={(e) => setDateFilter(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
    >
      <option value="All">All Time</option>
      <option value="Today">Today</option>
      <option value="Last3">Last 3 Days</option>
      <option value="Last7">Last 7 Days</option>
      <option value="Last30">Last 30 Days</option>
    </select>

    {/* 📆 Custom Date Range */}
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
    />
    <span className="text-gray-400 text-sm">to</span>
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
    />

    {/* 🔽 Sorting */}
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
      <option value="name">Name (A-Z)</option>
    </select>

    {/* Existing Filters */}
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
      <option value="All">All Type</option>
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
                  <th className="px-6 py-4">Lead Source</th>
                  <th className="px-6 py-4">Order Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Skeleton Loader
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900">No leads found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  leads.map((lead) => {
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
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{lead.name}</div>
                          <div className="text-gray-500 text-xs mt-1">{lead.email}</div>
                          <div className="text-gray-500 text-xs">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{lead.plan}</div>
                          <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">{lead.product? "Journal" : "Plans"}</div>
                        </td>
                        <td className="px-6 py-4 ">
                          <div className="text-gray-900 flex items-center"><IndianRupeeIcon size={14} /> {lead.amount}</div>
                          <div className="text-gray-500 text-xs mt-1">Total Quantity: {lead.product? lead.quantity : "No Applicable"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{parsedDate.toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs mt-1">{parsedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status || "New")}`}>
                            {lead.status || "New"}
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
        
        {/* Pagination Controls */}
        {!loading && pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Page {page} of {pages}
            </p>
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
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedLeadId(null)}
          />
          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform flex flex-col border-l border-gray-200">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button 
                onClick={() => setSelectedLeadId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sidebar Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h3>
                <div className="mt-3 space-y-2">
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
                   {selectedLead.plan} -{selectedLead.product? "Journal" : "Plans"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-3 text-gray-400" />
                    <span>
  Order Date:
  <span className="font-medium text-gray-700 ml-1">
    {selectedLead.createdAt &&
      new Date(
        selectedLead.createdAt?.$date || selectedLead.createdAt
      ).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
  </span>
</span>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle size={16} className="mr-3 text-green-400" />
                        <span>Payment Status: <span className="font-medium text-gray-900">{selectedLead.status}</span></span>
                        </div>
                  </div>
                <div>
                    <div className="flex items-center text-sm text-gray-600">
                        <IndianRupeeIcon size={16} className="mr-3 text-gray-400" />
                        <span>Payment Amount: <span className="font-medium text-gray-900">{selectedLead.amount}</span></span>
                        </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />
                  <div className="flex items-center text-sm text-gray-600">
    <span>
      Address:{" "}
      <span className="font-medium text-gray-900">
        {selectedLead.product
          ? `${selectedLead.customer?.address}, ${selectedLead.customer?.city}, ${selectedLead.customer?.pincode}` || "N/A"
          : "N/A"}
      </span>
    </span>
  </div>

  {/* MEDIUM */}
  <div className="flex items-center text-sm text-gray-600">
    <span>
      Payment URL:{" "}
      <span className="font-medium text-gray-900">
        {selectedLead.paymentUrl
          ? selectedLead.paymentUrl
          : "N/A"}
      </span>
    </span>
  </div>

  {/* CAMPAIGN */}
  <div className="flex items-center text-sm text-gray-600">
    <span>
      Payment Request Id:{" "}
      <span className="font-medium text-gray-900">
        {selectedLead.paymentRequestId
          ? selectedLead.paymentRequestId
          : "N/A"}
      </span>
    </span>
  </div>
<div className="flex items-center text-sm text-gray-600">
    <span>
      Payment Id:{" "}
      <span className="font-medium text-gray-900">
        {selectedLead.paymentId
          ? selectedLead.paymentId
          : "N/A"}
      </span>
    </span>
  </div>

              {/* Program & Goal Info */}
              <div className="bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-gray-100 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1 mb-1"><Award size={14}/> Plans</div>
                  <div className="text-sm font-medium text-gray-900">{selectedLead.product? selectedLead.product.name : "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1 mb-1"><Paperclip size={14}/> Description</div>
                  <div className="text-sm font-medium text-gray-900">{selectedLead.product ? selectedLead.product.desc : "N/A"}</div>
                </div>
              <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1 mb-1"><IndianRupeeIcon size={14}/> Plan Price</div>
                  <div className="text-sm font-medium text-gray-900">{selectedLead.product ? selectedLead.product.price : "N/A"}</div>
                </div>
              </div>

              <hr className="border-gray-100" />

             

            </div>
          </div>
        </>
      )}


    </div>
  );
}