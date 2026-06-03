"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import useDebounce from "@/lib/useDebounce"

import DataTable from "@/component/DataTable"
import EmptyState from "@/component/EmptyState"
import AccessDenied from "@/component/AccessDenied"

import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  X,
  PencilIcon,
  PlusCircleIcon,
} from "lucide-react"

import BackButton from "@/lib/BackButton"
import Image from "next/image"
import Link from "next/link"

export default function TestimonialsPage() {

  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)

  const [preview, setPreview] = useState(null)

  const [editModal, setEditModal] = useState(null)
  const [updating, setUpdating] = useState(false)

  const limit = 20

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchTestimonials = async () => {

    try {

      setLoading(true)

      const res = await apiRequest(
        `/api/testimonials?page=${page}&limit=${limit}&search=${debouncedSearch}`
      )

      if (res.unauthorized) {
        setUnauthorized(true)
        return
      }

      if (res.error) return

      const payload = res.data

      setTestimonials(payload.data || [])
      setPages(payload.pages || 0)

    } catch (error) {

      console.error(error)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    fetchTestimonials()
  }, [page, debouncedSearch])

  if (unauthorized) return <AccessDenied />

  const getYoutubeEmbed = (url) => {

    try {

      const videoId =
        url.includes("watch?v=")
          ? url.split("watch?v=")[1].split("&")[0]
          : url.split("/").pop()

      return `https://www.youtube.com/embed/${videoId}`

    } catch {

      return url

    }

  }

  const updateTestimonial = async () => {

    try {

      setUpdating(true)

      const res = await fetch(
        `/api/testimonials/${editModal._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(editModal)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setEditModal(null)

      fetchTestimonials()

    } catch (error) {

      console.error(error)

      toast.error(error.message)

    } finally {

      setUpdating(false)

    }

  }

  const columns = [
    {
      label: "Name",
      accessor: "name"
    },
    {
      label: "Testimonial",
      accessor: "testimonial",
      render: (value) => (
        <p className="max-w-xs truncate">
          {value}
        </p>
      )
    },
    {
      label: "Location",
      accessor: "location",
      render: (value) => value || "-"
    },
    {
      label: "Image",
      accessor: "image",
      render: (value, row) => (
        value ? (
          <button
            onClick={() =>
              setPreview({
                type: "image",
                url: value,
                name: row.name
              })
            }
            className="flex items-center gap-2 text-blue-600 bg-blue-50 cursor-pointer px-2 py-1 rounded-md hover:underline"
          >
            <ImageIcon size={16} />
            View
          </button>
        ) : "-"
      )
    },
    {
      label: "Video",
      accessor: "youtubeUrl",
      render: (value, row) => (
        value ? (
          <button
            onClick={() =>
              setPreview({
                type: "video",
                url: value,
                name: row.name
              })
            }
            className="flex items-center gap-2 text-red-600 bg-red-50 cursor-pointer px-2 py-1 rounded-md hover:underline"
          >
            <Video size={16} />
            Watch
          </button>
        ) : "-"
      )
    },
    {
      label: "Actions",
      accessor: "actions",
      render: (_, row) => (
        <button
          onClick={() => setEditModal(row)}
          className="px-3 py-1.5 bg-gray-100 gap-2 flex items-center text-gray-700 rounded-md text-xs"
        >
        <PencilIcon size={8} />  Edit 
        </button>
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
    <div className="p-8 min-h-screen w-full font-sans">

      <BackButton />

      <div className="space-y-6">

        <h1 className="text-2xl font-semibold mt-4">
          Testimonials
        </h1>
<div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search testimonials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white w-full md:w-80"
        />
        <Link href="/testimonials/add" title="add testimonials" className="bg-[#05335c] text-white flex items-center gap-2 cursor-pointer py-2.5 rounded-lg px-8"><PlusCircleIcon size={16}/> Add Testimonials</Link>
</div>
        {loading ? (

          <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-100 rounded-lg"
              />
            ))}
          </div>

        ) : testimonials.length === 0 ? (

          <EmptyState
            icon={MessageSquare}
            title="No testimonials"
            description="No testimonials available."
          />

        ) : (

          <>
            <DataTable
              columns={columns}
              data={testimonials}
            />

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

      {/* Preview Modal */}
      {preview && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">

          <div className="bg-white rounded-2xl mx-auto relative p-6">

            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-semibold mb-5">
              {preview.name}
            </h2>

            {preview.type === "image" ? (

              <Image
                src={preview.url}
                alt="testimonial"
                height={100}
                width={600}
              />

            ) : (

              <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border">

                <iframe
                  src={getYoutubeEmbed(preview.url)}
                  className="w-full h-full"
                  allowFullScreen
                />

              </div>

            )}

          </div>

        </div>

      )}

      {/* Edit Modal */}
      {editModal && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">

          <div className="bg-white rounded-2xl w-full max-w-2xl relative p-6 overflow-y-auto max-h-[90vh]">

            <button
              onClick={() => setEditModal(null)}
              className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-semibold mb-6">
              Edit Testimonial
            </h2>

            <div className="space-y-5">

              <div>
                <label className="text-sm font-medium">
                  Name
                </label>

                <input
                  type="text"
                  value={editModal.name || ""}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      name: e.target.value
                    })
                  }
                  className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Testimonial
                </label>

                <textarea
                  rows={5}
                  value={editModal.testimonial || ""}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      testimonial: e.target.value
                    })
                  }
                  className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="text-sm font-medium">
                    Age
                  </label>

                  <input
                    type="text"
                    value={editModal.age || ""}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        age: e.target.value
                      })
                    }
                    className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Location
                  </label>

                  <input
                    type="text"
                    value={editModal.location || ""}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        location: e.target.value
                      })
                    }
                    className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>

              </div>

              <div>
                <label className="text-sm font-medium">
                  YouTube URL
                </label>

                <input
                  type="text"
                  value={editModal.youtubeUrl || ""}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      youtubeUrl: e.target.value
                    })
                  }
                  className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              {editModal.image && (

                <div>

                  <label className="text-sm font-medium block mb-2">
                    Current Image
                  </label>

                  <Image
                    src={editModal.image}
                    alt="iamge"
                    height={200}
                    width={400}
                  />

                </div>

              )}

              <div className="flex justify-end gap-3 pt-4">

                <button
                  onClick={() => setEditModal(null)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  disabled={updating}
                  onClick={updateTestimonial}
                  className="px-5 py-2.5 bg-black text-white rounded-lg disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}