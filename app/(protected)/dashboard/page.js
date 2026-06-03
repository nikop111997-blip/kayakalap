'use client'
import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Users, UserPlus, 
  Target, Mail, Activity, CheckCircle, BarChart3, Plus,
  Eye,
  EyeIcon
} from 'lucide-react';
import Skeleton from '@/component/Skeleton';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
const [range, setRange] = useState("monthly")
  useEffect(() => {
    // 🔴 ACTUAL API INTEGRATION 🔴
    // Adjust the endpoint URL if your API route is named differently
    fetch(`/api/dashboard?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((apiData) => {
        setData(apiData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        // Fallback data strictly mapped to your API's schema so the UI renders in this preview tool.
        // In your actual app, you can replace this catch block with proper error handling.
        setData({
          cards: { totalLeads: 54890, totalContacts: 1429, totalQuiz: 45210, totalNewsletter: 8251 },
          statusStats: [
            { _id: "Active", count: 15 },
            { _id: "Pending", count: 12 },
            { _id: "Closed", count: 2847 }
          ],
          goals: [
            { _id: "Weight Loss", count: 234 },
            { _id: "Muscle Gain", count: 189 },
            { _id: "Endurance", count: 89 }
          ],
          dailyLeads: [
            { _id: "Jan", count: 3500 }, { _id: "Feb", count: 7000 },
            { _id: "Mar", count: 5500 }, { _id: "Apr", count: 9500 },
            { _id: "May", count: 7000 }, { _id: "Jun", count: 5000 },
            { _id: "Jul", count: 2000 }, { _id: "Aug", count: 8500 },
            { _id: "Sep", count: 7000 }, { _id: "Oct", count: 9000 },
            { _id: "Nov", count: 7500 }, { _id: "Dec", count: 3000 }
          ],
          quizScores: [
            { _id: "High", count: 60 },
            { _id: "Medium", count: 25 },
            { _id: "Low", count: 15 }
          ],
          recentContacts: [
            { _id: 1, name: "Alice Johnson", goal: "Weight Loss", createdAt: new Date().toISOString() },
            { _id: 2, name: "Robert Smith", goal: "Muscle Gain", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { _id: 3, name: "Maria Garcia", goal: "Endurance", createdAt: new Date(Date.now() - 172800000).toISOString() }
          ]
        });
        setLoading(false);
      });
  }, [range]);

  if (loading) {
    return (
      <Skeleton />
    );
  }

  // Calculate max for the chart scaling
  const maxChartValue = Math.max(...(data?.dailyLeads?.map(d => d.count) || [10000]));

  return (
    <div className="min-h-screen p-8 font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening with your leads today.</p>
        </div>
        <Link href={`/leads`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-blue-200/50 flex items-center gap-2 text-sm">
          <EyeIcon size={18} /> Leads
        </Link>
      </header>

    

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Section (Stats & Chart) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* 2x2 Stats Grid mapping to your total counts */}
          <div className="grid grid-cols-3 gap-6">
            <StatCard 
  title="Total Leads"
  value={data.cards.totalLeads}
  trend={data.trends.leads.value}
  isPositive={data.trends.leads.positive}
/>
<StatCard 
  title="Landing Page Lead"
  value={data.cards.totalAd}
  trend={data.trends.adlead.value}
  isPositive={data.trends.adlead.positive}
/>
<StatCard 
  title="Contacts"
  value={data.cards.totalContacts}
  trend={data.trends.contacts.value}
  isPositive={data.trends.contacts.positive}
/>

<StatCard 
  title="Quiz"
  value={data.cards.totalQuiz}
  trend={data.trends.quiz.value}
  isPositive={data.trends.quiz.positive}
/>
<StatCard 
  title="Enquiry"
  value={data.cards.totalEnuiry}
  trend={data.trends.enquiry.value}
  isPositive={data.trends.enquiry.positive}
/>
<StatCard 
  title="Newsletter"
  value={data.cards.totalNewsletter}
  trend={data.trends.newsletter.value}
  isPositive={data.trends.newsletter.positive}
/>
          </div>

          {/* Lead Analytics Chart Area mapping to dailyLeads */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-slate-900">Lead Analytics</h3>
              <div className="flex space-x-1 bg-slate-50 p-1 rounded-full border border-slate-100">

  {["daily", "weekly", "monthly"].map((r) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors capitalize
        ${range === r 
          ? "bg-slate-900 text-white shadow-sm" 
          : "text-slate-500 hover:text-slate-900"
        }`}
    >
      {r}
    </button>
  ))}

</div>
            </div>
            
            {/* CSS-based Bar Chart Representation */}
            <div className="h-64 flex items-end justify-between space-x-2 px-2 relative">
              {/* Y-Axis lines (Mocked) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-b border-slate-300"></div>
                ))}
              </div>
              
              {data?.dailyLeads?.map((day, i) => {
                const heightPercentage = (day.count / maxChartValue) * 100;
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full flex-1 group z-10">
                    <div 
                      className="w-full max-w-[2.5rem] bg-gradient-to-t from-blue-100 to-blue-400 rounded-t-md transition-all duration-300 group-hover:to-blue-500 group-hover:shadow-lg group-hover:shadow-blue-200"
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-wider">{day._id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section (Insights & Users) */}
        <div className="space-y-6">
          
          {/* Combined Insights Panel */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Lead Insights</h3>
            
            {/* Status Breakdown (Top) */}
            <div className="space-y-5 mb-8">
              {data?.statusStats?.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      {i === 0 ? <UserPlus size={18} /> : i === 1 ? <Activity size={18} /> : <Users size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{stat._id} Status</p>
                      <p className="text-xs text-slate-400">All Time</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{stat.count.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <hr className="border-slate-100 mb-6" />

            {/* Recent Contacts (Middle) */}
            <h4 className="text-sm font-bold text-slate-900 mb-4">Recent Leads</h4>
            <div className="space-y-4 mb-8">
              {data?.recentContacts?.map((contact, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-sky-300 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(contact.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {contact.goal || 'General'}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-slate-100 mb-6" />

            {/* Quiz Performance / High Scorers */}
            <h4 className="text-sm font-bold text-slate-900 mb-4">High Score Quiz Completion</h4>
            {data?.quizScores?.filter(s => s._id === "High").map((score, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${score.count}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-blue-500 ml-4">{score.count}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">+2.4% from last month</p>
              </div>
            ))}
          </div>

          {/* Goals / Programs Card */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-5">Top Goals</h3>
            <div className="space-y-4">
              {data?.goals?.slice(0, 2).map((goal, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{goal._id}</p>
                    <p className="text-[10px] text-slate-400">{goal.count} users targeted</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${i === 0 ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600'}`}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-component for the top stat cards
function StatCard({ title, value, trend, isPositive }) {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between h-40">
      <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
      <div className="mt-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h2>
        <div className="flex items-center gap-1 mt-3">
          <span className={`flex items-center text-xs font-semibold ${isPositive ? 'text-blue-500' : 'text-slate-400'}`}>
            {isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            {trend}
          </span>
          <span className="text-xs text-slate-400 ml-1">This month</span>
        </div>
      </div>
    </div>
  );
}