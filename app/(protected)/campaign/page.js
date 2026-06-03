'use client'
import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Filter, Plus, Upload, X, MessageSquare, 
  Calendar, User, Phone, Mail, ChevronRight, CheckCircle, 
  XCircle, Clock, AlertCircle, ArrowDownToLine, Target, Award,
  ListChecks
} from "lucide-react";
import Link from "next/link";
import BackButton from "@/lib/BackButton";

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
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, Last3, Last7, Last30
  const limit = 20;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter]);

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
        ...(dateFilter !== "All" && { dateFilter })
      });

      const res = await apiRequest(`/api/campaign?${params.toString()}`);

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
  }, [page, debouncedSearch, dateFilter, sort, fromDate, toDate]);






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
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <BackButton />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your email campaigns.</p>
        </div>
        <div className="flex gap-2">
     <Link
  href="/send-mail"
  className="flex items-center gap-2 px-4 py-2 bg-[#05335c] text-white rounded-lg hover:bg-blue-900 font-medium transition-colors shadow-sm"
>
  <Plus size={18} />
  New Campaign
</Link>
 <Link
  href="/mail-logs"
  className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-[#05335c] rounded-lg hover:bg-blue-100 font-medium transition-colors shadow-sm"
>
  <ListChecks size={18} />
  Email Logs
</Link></div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 items-center shadow-sm z-10">
  
  {/* 🔍 Search */}
  <div className="relative flex-grow max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      type="text"
      placeholder="Search name ..."
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
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Subject</th>
                   <th className="px-6 py-4">Total Recipients</th>
                    <th className="px-6 py-4">Sent</th>
                     <th className="px-6 py-4">Opened</th>
                     <th className="px-6 py-4">Clicked</th>
                  <th className="px-6 py-4">Date Created</th>
                  
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
                        <p className="text-lg font-medium text-gray-900">No campaigns found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
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
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{lead.title}</div>
                        
                         
                        </td>
                        <td className="px-6 py-4">
                         <div className="text-gray-500 text-xs mt-1">{lead.subject}</div>
                          
                        </td>
                        <td className="px-6 py-4">
                         <div className="text-gray-500 text-xs mt-1">{lead.total}</div>
                        </td>
                        <td className="px-6 py-4">
                         <div className="text-gray-500 text-xs mt-1">{lead.sent}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-500 text-xs mt-1">{lead.openedCount}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-500 text-xs mt-1">{lead.clickedCount}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{parsedDate.toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs mt-1">{parsedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        {/* <td className="px-6 py-4">
                          <button className={`px-4 py-3 cursor-pointer rounded-full text-xs font-semibold ${getStatusColor(lead.status || "New")}`}>
                            convert to lead
                          </button>
                        </td> */}
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

    


    

    </div>
  );
}