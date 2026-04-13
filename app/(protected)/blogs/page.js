"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api"
import DataTable from "@/component/DataTable"
import EmptyState from "@/component/EmptyState"
import AccessDenied from "@/component/AccessDenied"
import AnimatedButton from "@/component/Button"
import { FileText } from "lucide-react"
import ConfirmModal from "@/component/ConfirmationModal"
import useDebounce from "@/lib/useDebounce"
import BackButton from "@/lib/BackButton"
export default function BlogsPage() {
  const router = useRouter()

  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
const [deleteId, setDeleteId] = useState(null)
const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const debouncedSearch = useDebounce(search, 500)   // ✅ ADD HERE

  const limit = 10

useEffect(() => {
  setPage(1)
}, [debouncedSearch])

  // 🔥 Fetch blogs
  const fetchBlogs = async () => {
    setLoading(true)

    const res = await apiRequest(
      `/api/content/blog?search=${debouncedSearch}&page=${page}&limit=${limit}`
    )

    setLoading(false)

    if (res.unauthorized) {
      setUnauthorized(true)
      return
    }

    if (res.error) return

    setBlogs(res.data?.data || [])
    setPages(res.data?.pages || 1)
  }

  // Fetch when page OR debounced search changes
  useEffect(() => {
    fetchBlogs()
  }, [page, debouncedSearch])

  if (unauthorized) return <AccessDenied />

  const columns = [
    { label: "Title", accessor: "title" },
    { label: "Slug", accessor: "slug" },
    { label: "Status", accessor: "status" },
  ]
const handleDelete = async () => {
  if (!deleteId) return

  setDeleting(true)

  const res = await apiRequest(
    `/api/content/blog/${deleteId}`,
    { method: "DELETE" }
  )

  setDeleting(false)

  if (res.error) return

  setDeleteId(null)
  fetchBlogs()
}
  return (
    <div className="p-8  min-h-screen font-sans w-full">
      <BackButton />
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-2xl font-semibold">Blogs</h1>

          <AnimatedButton
            onClick={() => router.push("/blogs/create")}
          >
            + Create Blog
          </AnimatedButton>
        </div>

        {/* 🔍 Search */}
        <div>
          <input
            type="text"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 border border-gray-300 rounded-lg  px-4 py-2 bg-white"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100  " />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No blogs found"
            description="Start by creating your first blog."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={blogs}
              renderActions={(row) => (
  <div className="flex gap-3">
    <button
      onClick={() =>
        router.push(`/blogs/edit/${row._id}`)
      }
      className="text-blue-600 text-sm"
    >
      Edit
    </button>

    <button
      onClick={() => setDeleteId(row._id)}
      className="text-red-600 text-sm"
    >
      Delete
    </button>
  </div>
)}
            />

            {/* 🔥 Pagination */}
            {pages > 1 && (
              <div className="flex justify-between items-center pt-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {pages}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className={`px-3 py-1 border rounded ${
                      page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Prev
                  </button>

                  <button
                    disabled={page === pages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className={`px-3 py-1 border rounded ${
                      page === pages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmModal
  open={!!deleteId}
  onClose={() => setDeleteId(null)}
  onConfirm={handleDelete}
  loading={deleting}
  title="Delete Blog"
  description="This blog will be moved to trash. You can restore it later."
/>
    </div>
  )
}