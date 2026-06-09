'use client'
import React, { useState, useEffect } from "react";
import { 
  Search, Filter, AlertCircle, X, User, Phone, Mail, MapPin, Briefcase, Calendar, Activity, CheckCircle2, Target
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
// Updated Plans to match API response
const PLANS = ["All", "Legacy", "Elite", "Pro", "Platinum"];

const STATUSES = [
  "All",
  "new", 
  "Interested", 
  "Not Interested", 
  "Invalid", 
  "Converted", 
  "Call Back"
];

// --- HELPER COMPONENT FOR MODAL DETAILS ---
const DetailItem = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</h4>
      <p className="text-sm text-gray-900 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
        {displayValue}
      </p>
    </div>
  );
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Filters & Sorting
  const [sort, setSort] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [dateFilter, setDateFilter] = useState("All"); 
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, statusFilter, planFilter, sort, fromDate, toDate]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        sort,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(dateFilter !== "All" && { dateFilter }),
        ...(statusFilter !== "All" && { status: statusFilter }),
        ...(planFilter !== "All" && { plan: planFilter })
      });

      const res = await apiRequest(`/api/pricingform?${params.toString()}`);

      if (res.unauthorized) {
        setUnauthorized(true);
        return;
      }

      if (!res.error && res.data) {
        const payload = res.data;
        setLeads(payload.data || []);
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
  }, [page, debouncedSearch, dateFilter, sort, fromDate, toDate, statusFilter, planFilter]);

  const getLeadId = (lead) => typeof lead._id === 'object' && lead._id !== null ? lead._id.$oid : lead._id;

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const parsedDate = typeof dateValue === 'object' && dateValue !== null 
        ? new Date(dateValue.$date) 
        : new Date(dateValue);
    return `${parsedDate.toLocaleDateString()} at ${parsedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
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
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center gap-4 shadow-sm z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiry Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your fitness program inquiries.</p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 items-center shadow-sm z-10">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, mobile, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {PLANS.map(p => <option key={p} value={p}>{p === "All" ? "All Plans" : p}</option>)}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Last3">Last 3 Days</option>
            <option value="Last7">Last 7 Days</option>
            <option value="Last30">Last 30 Days</option>
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
                  <th className="px-6 py-4">Name & Info</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Plan / Status</th>
                  <th className="px-6 py-4">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-3 bg-gray-200 rounded w-3/4"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900">No leads found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, index) => {
                    const leadId = getLeadId(lead);
                    return (
                      <tr 
                        key={leadId} 
                        onClick={() => setSelectedLeadId(leadId)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">
                            {((page - 1) * limit) + index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{lead.fullName || "—"}</div>
                          {lead.age && <div className="text-gray-500 text-xs mt-1">Age: {lead.age}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{lead.mobile || "—"}</div>
                          <div className="text-gray-500 text-xs mt-1">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-medium text-gray-900">{lead.plan || "—"}</div>
                           <div className="text-xs mt-1 px-2 py-0.5 inline-block rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                             {lead.status || "New"}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 text-sm">{formatDate(lead.createdAt).split(' at ')[0]}</div>
                          <div className="text-gray-500 text-xs mt-1">{formatDate(lead.createdAt).split(' at ')[1]}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- LEAD DETAILS MODAL --- */}
      {selectedLead && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                  {selectedLead.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLead.fullName || "Unnamed Lead"}</h2>
                  <div className="flex items-center text-gray-500 text-xs mt-0.5 gap-2">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(selectedLead.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-800 font-medium text-sm border border-gray-200 capitalize shadow-sm">
                  Status: {selectedLead.status || "New"}
                </span>
                <button 
                  onClick={() => setSelectedLeadId(null)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-2 bg-gray-50 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: User Contact & Plan Core Info */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
                      <User size={16} className="text-blue-500" /> Basic Details
                    </h3>
                    <div className="space-y-4">
                      {selectedLead.mobile && (
                        <div className="flex items-start gap-3">
                          <Phone className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.mobile}</p><p className="text-xs text-gray-500">Mobile</p></div>
                        </div>
                      )}
                      {selectedLead.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.email}</p><p className="text-xs text-gray-500">Email</p></div>
                        </div>
                      )}
                      {selectedLead.city && (
                        <div className="flex items-start gap-3">
                          <MapPin className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.city}</p><p className="text-xs text-gray-500">City</p></div>
                        </div>
                      )}
                      {selectedLead.age && (
                        <div className="flex items-start gap-3">
                          <User className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.age}</p><p className="text-xs text-gray-500">Age Group</p></div>
                        </div>
                      )}
                      {selectedLead.occupation && (
                        <div className="flex items-start gap-3">
                          <Briefcase className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.occupation}</p><p className="text-xs text-gray-500">Occupation</p></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
                      <Activity size={16} className="text-green-500" /> Plan Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Target className="text-gray-400 mt-0.5" size={16} />
                        <div><p className="text-sm font-medium text-gray-900">{selectedLead.plan || "N/A"}</p><p className="text-xs text-gray-500">Interested Plan</p></div>
                      </div>
                      {/* Legacy Specific Core Info */}
                      {selectedLead.coachName && (
                        <div className="flex items-start gap-3">
                          <User className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.coachName}</p><p className="text-xs text-gray-500">Assigned Coach</p></div>
                        </div>
                      )}
                      {selectedLead.duration && (
                        <div className="flex items-start gap-3">
                          <Calendar className="text-gray-400 mt-0.5" size={16} />
                          <div><p className="text-sm font-medium text-gray-900">{selectedLead.duration}</p><p className="text-xs text-gray-500">Duration</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Extensive Questionnaire Answers */}
                <div className="lg:col-span-2">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 border-b pb-3">
                      <CheckCircle2 size={20} className="text-indigo-500" /> Discovery Questionnaire
                    </h3>
                    
                    <div className="space-y-2">
                      {/* --- ELITE PLAN FIELDS --- */}
                      {selectedLead.plan === "Elite" && (
                        <>
                          <DetailItem label="Primary Goal" value={selectedLead.primaryGoal} />
                          <DetailItem label="Weight Loss Goal" value={selectedLead.weightLossGoal} />
                          <DetailItem label="Current Health Rating (1-10)" value={selectedLead.healthRating} />
                          <DetailItem label="Biggest Challenge" value={selectedLead.biggestChallenge} />
                          <DetailItem label="Why is this important now?" value={selectedLead.whyImportant} />
                          <DetailItem label="Health Concerns/Injuries" value={selectedLead.concerns} />
                          <DetailItem label="Open to Coaching?" value={selectedLead.openToCoaching} />
                          <DetailItem label="Time Commitment" value={selectedLead.timeCommitment} />
                          <DetailItem label="Worked with a coach before?" value={selectedLead.workedWithCoach} />
                          <DetailItem label="Support Looking For" value={selectedLead.supportLookingFor} />
                          <DetailItem label="Why Elite Plan?" value={selectedLead.whyElite} />
                          <DetailItem label="What best describes you?" value={selectedLead.bestDescribesYou} />
                          <DetailItem label="Investment Readiness" value={selectedLead.investmentReady} />
                          <DetailItem label="Anything Else?" value={selectedLead.anythingElse} />
                        </>
                      )}

                      {/* --- LEGACY PLAN FIELDS --- */}
                      {selectedLead.plan === "Legacy" && (
                        <>
                          <DetailItem label="Biggest Achievements So Far" value={selectedLead.biggestAchievement} />
                          <DetailItem label="Single Biggest Win" value={selectedLead.biggestWin} />
                          <DetailItem label="Next Goals" value={selectedLead.nextGoals} />
                          <DetailItem label="Why the Legacy Plan?" value={selectedLead.whyLegacy} />
                          <DetailItem label="Most Valuable Support Needed" value={selectedLead.valuableSupport} />
                          <DetailItem label="What Best Describes You?" value={selectedLead.bestDescribesYouLegacy} />
                          <DetailItem label="Ready to Commit?" value={selectedLead.readyToCommit} />
                        </>
                      )}

                      {/* Fallback if no questions matched */}
                      {(!selectedLead.plan || (selectedLead.plan !== "Elite" && selectedLead.plan !== "Legacy")) && (
                        <p className="text-gray-500 italic text-sm">No questionnaire data available for this plan type.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}