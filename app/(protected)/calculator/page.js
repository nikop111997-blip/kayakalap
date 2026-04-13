"use client"

import React, { useEffect, useState } from "react"
import { Mail } from "lucide-react"
import BackButton from "@/lib/BackButton"

// --- INLINE DEPENDENCIES & MOCKS ---
// To ensure the file runs independently, components and hooks are defined here.

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Mocking the API request with the provided sample data


const DataTable = ({ columns, data, onRowClick }) => (
  <div className="overflow-x-auto w-full">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {columns.map((c, i) => (
            <th key={i} className="p-4 text-sm font-semibold text-gray-600">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            onClick={() => onRowClick(row)}
            className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
          >
            {columns.map((c, j) => (
              <td key={j} className="p-4 text-sm text-gray-800">
                {c.render ? c.render(row[c.accessor]) : row[c.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
    {Icon && <Icon className="w-12 h-12 text-gray-300 mb-4" />}
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className="text-gray-500 mt-1">{description}</p>
  </div>
)

const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
  </div>
)



// --- MAIN PAGE COMPONENT ---

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)

  const [selectedLead, setSelectedLead] = useState(null)

  const limit = 20

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchContacts = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `/api/questions?page=${page}&limit=${limit}&search=${debouncedSearch}`
      )

      if (res.unauthorized) {
        setUnauthorized(true)
        return
      }

      if (res.error) return

      const payload = await res.json()
      setContacts(payload.data || [])
      setPages(payload.pages || 0)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [page, debouncedSearch])

  if (unauthorized) return <AccessDenied />

  // ✅ Answer Mapping updated with FULL TEXT from the quiz
  const answerMap = {
    q1: [
      "I get completely overwhelmed, my sleep gets ruined, and I end up comfort eating or stress-eating.",
      "I just push through it, but I feel tired all the time and lose my patience easily.",
      "I manage okay, but my mind is always racing and I rarely get time to truly relax.",
      "I handle stress well. I stay calm and don't let it affect my health or my eating habits."
    ],
    q2: [
      "I have a lot of stubborn weight that just won't budge, no matter how little I eat. I feel exhausted all day.",
      "I hit a wall in the afternoon. I need tea, coffee, or something sweet just to keep my eyes open.",
      "I can lose weight if I try very hard, but my metabolism has definitely slowed down as I’ve gotten older.",
      "My weight is stable and healthy. I have great energy from morning until night."
    ],
    q3: [
      "I am stuck in a frustrating cycle. I try strict diets, starve myself, lose a little weight, and then gain it all back.",
      "I want to eat healthy, but my busy schedule, travel, or family cooking makes it very hard to be consistent.",
      "I watch everything I eat and constantly worry about calories, but it feels like a chore.",
      "I eat well without stressing. I enjoy family dinners and social functions without feeling guilty or gaining weight."
    ],
    q4: [
      "My joints feel stiff and painful (knees, back, etc.). I am honestly too tired or in too much pain to exercise regularly.",
      "I try to go for walks or do basic exercises, but I don't see any real weight loss or strength changes.",
      "I exercise, but I hate it. It feels like a punishment just to burn calories.",
      "I have a great exercise routine. My body feels strong, flexible, and completely pain-free."
    ],
    q5: [
      "Terrible. I toss and turn, or wake up in the middle of the night. I wake up feeling completely exhausted.",
      "Average. I get some sleep, but I always hit snooze and need a strong cup of tea/coffee to get out of bed.",
      "I sleep fine most nights, but I still feel like my body hasn't fully rested.",
      "Excellent. I fall asleep easily, sleep peacefully, and wake up feeling fresh and ready for the day."
    ],
  }

  const columns = [
    {
      label: "Name",
      accessor: "name",
    },
    {
      label: "Email",
      accessor: "email",
    },
    {
      label: "Phone",
      accessor: "whatsapp",
    },
    {
      label: "Score",
      accessor: "score",
      render: (val) => (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#05335c] rounded">
          {val}
        </span>
      )
    },
    {
      label: "Created",
      accessor: "createdAt",
      render: (value) =>
        new Date(value).toLocaleString()
    }
  ]

  return (
    <div className="p-8 min-h-screen w-full font-sans text-gray-900">
      <div className="">
        <BackButton />

        <div className="space-y-6 mt-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Calculator User Management
            </h1>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="bg-white p-6 space-y-4 rounded-lg shadow-sm">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No Leads"
              description="No contact form messages found."
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* TABLE */}
              <DataTable
                columns={columns}
                data={contacts}
                onRowClick={(row) => setSelectedLead(row)}
              />

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-lg">
                  <p className="text-sm text-gray-500 font-medium">
                    Page {page} of {pages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-sm font-medium transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ✅ MODAL POPUP - FULL DETAILS */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-5 mb-6 sticky top-0 bg-white z-10 pt-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Submitted on {new Date(selectedLead.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-100">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</span>
                      <span className="text-sm font-medium text-gray-900 col-span-2">{selectedLead.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</span>
                      <span className="text-sm font-medium text-gray-900 col-span-2">{selectedLead.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</span>
                      <span className="text-sm font-medium text-gray-900 col-span-2">{selectedLead.whatsapp}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Age</span>
                      <span className="text-sm font-medium text-gray-900 col-span-2">{selectedLead.age || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Score</span>
                      <span className="col-span-2">
                        <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded-full shadow-sm">
                          {selectedLead.score} Points
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Lifestyle Context */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-100">Lifestyle Context</h3>
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Daily Schedule</span>
                      <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800">
                        {selectedLead.schedule || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Primary Frustration</span>
                      <p className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm font-medium text-red-900">
                        {selectedLead.frustration || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width: Quiz Answers */}
              <div className="mt-10">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-100">Complete Quiz Answers</h3>
                
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:border-blue-200">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Q1: Managing Daily Stress</span>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedLead?.answers?.q1 !== undefined ? answerMap.q1[selectedLead.answers.q1] : "No answer"}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:border-blue-200">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Q2: Weight Loss & Daily Energy</span>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedLead?.answers?.q2 !== undefined ? answerMap.q2[selectedLead.answers.q2] : "No answer"}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:border-blue-200">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Q3: Diet & Eating Habits</span>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedLead?.answers?.q3 !== undefined ? answerMap.q3[selectedLead.answers.q3] : "No answer"}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:border-blue-200">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Q4: Exercise & Joint Health</span>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedLead?.answers?.q4 !== undefined ? answerMap.q4[selectedLead.answers.q4] : "No answer"}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:border-blue-200 md:col-span-2">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Q5: Sleep & Waking Up</span>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedLead?.answers?.q5 !== undefined ? answerMap.q5[selectedLead.answers.q5] : "No answer"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}