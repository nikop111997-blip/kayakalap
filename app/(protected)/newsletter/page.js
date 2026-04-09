"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import useDebounce from "@/lib/useDebounce"

import DataTable from "@/component/DataTable"
import EmptyState from "@/component/EmptyState"
import AccessDenied from "@/component/AccessDenied"

import { Mail } from "lucide-react"
import BackButton from "@/lib/BackButton"

export default function SubscribersPage() {

  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)

  const limit = 20

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchSubscribers = async () => {

    try {

      setLoading(true)

      const res = await apiRequest(
        `/api/admin/subscribers?page=${page}&limit=${limit}&search=${debouncedSearch}`
      )

      if (res.unauthorized) {
        setUnauthorized(true)
        return
      }

      if (res.error) return

      const payload = res.data

      setSubs(payload.data || [])
      setPages(payload.pages || 0)

    } catch (error) {

      console.error(error)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    fetchSubscribers()
  }, [page, debouncedSearch])

  if (unauthorized) return <AccessDenied />

  const columns = [
    {
      label: "Email",
      accessor: "email"
    },
    {
      label: "Subscribed On",
      accessor: "createdAt",
      render: (value) =>
        new Date(value).toLocaleString()
    }
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-full font-sans">
      <BackButton />
      <div className="space-y-6">

        <h1 className="text-2xl font-semibold mt-4">
          Subscribers
        </h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search email or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 bg-white w-full md:w-80"
        />

        {loading ? (

          <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg" />
            ))}
          </div>

        ) : subs.length === 0 ? (

          <EmptyState
            icon={Mail}
            title="No subscribers"
            description="No one has subscribed yet."
          />

        ) : (

          <>
            <DataTable
              columns={columns}
              data={subs}
            />

            {/* Pagination */}
            {pages > 1 && (

              <div className="flex justify-between items-center pt-6">

                <p className="text-sm text-gray-500">
                  Page {page} of {pages}
                </p>

                <div className="flex gap-2">

                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white"
                  >
                    Prev
                  </button>

                  <button
                    disabled={page === pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white"
                  >
                    Next
                  </button>

                </div>

              </div>

            )}

          </>
        )}

      </div>

    </div>
  )
}