"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import DataTable from "@/component/DataTable"
import AnimatedInput from "@/component/Input"
import AnimatedButton from "@/component/Button"
import { generateSlug } from "@/lib/generateSlug"
import Skeleton from "@/component/Skeleton"
import { FolderPlus } from "lucide-react"
import EmptyState from "@/component/EmptyState"
import AccessDenied from "@/component/AccessDenied"
import BackButton from "@/lib/BackButton"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [authorised, setAuthorised] = useState(true)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", slug: "" })
  const limit = 5

  const fetchCategories = async () => {
    setLoading(true)
    const res = await fetch(
      `/api/content/categories?page=${page}&limit=${limit}&search=${search}`
    )
    if(res.status==="409"){
        setAuthorised(false)
    }
    const data = await res.json()

    setCategories(data.data)
    setPages(data.pages)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [page, search])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", slug: "" })
    setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ name: row.name, slug: row.slug })
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = editing
      ? `/api/content/categories/${editing._id}`
      : `/api/content/categories`

    const method = editing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.message)
      return
    }

    toast.success(
      editing
        ? "Category updated successfully"
        : "Category created successfully"
    )

    setModal(false)
    fetchCategories()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/content/categories/${id}`, {
      method: "DELETE",
    })

    toast.success("Category deleted")
    fetchCategories()
  }

  const columns = [
    { label: "Name", accessor: "name" },
    { label: "Slug", accessor: "slug" },
    {
      label: "Created",
      accessor: "createdAt",
      render: (value) =>
        new Date(value).toLocaleDateString(),
    },
  ]
if(!authorised){
    return(
        <div className="p-12 space-y-6 bg-gray-50 min-h-screen w-full font-sans">
        <AccessDenied />
        </div>
    )
}
  return (
    <div className="p-12 space-y-6 min-h-screen w-full font-sans">
      <BackButton />
      <div className=" space-y-6">

        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Categories
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your blog categories
            </p>
          </div>

          <AnimatedButton onClick={openCreate}>
            + New Category
          </AnimatedButton>
        </div>

        <div className="flex justify-between items-center">
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border rounded-lg border-gray-300 w-64"
          />
        </div>

      {loading ? (
  <Skeleton />
) : categories.length === 0 ? (
  <EmptyState
    icon={FolderPlus}
    title="No categories found"
    description="You haven’t created any categories yet. Start by creating your first category."
  >
    <AnimatedButton onClick={openCreate}>
      Create Category
    </AnimatedButton>
  </EmptyState>
) : (
  <DataTable
    columns={columns}
    data={categories}
    renderActions={(row) => (
      <div className="flex justify-end gap-3">
        <button
          onClick={() => openEdit(row)}
          className="text-blue-600 text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(row._id)}
          className="text-red-600 text-sm"
        >
          Delete
        </button>
      </div>
    )}
  />
)}

       {!loading && categories.length > 0 && pages > 1 && (
  <div className="flex justify-between items-center pt-6">
    <p className="text-sm text-gray-500">
      Page {page} of {pages}
    </p>

    <div className="flex gap-2">
      <button
        disabled={page === 1}
        onClick={() => setPage((prev) => prev - 1)}
        className={`px-3 py-1 border rounded 
          ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Prev
      </button>

      <button
        disabled={page === pages}
        onClick={() => setPage((prev) => prev + 1)}
        className={`px-3 py-1 border rounded 
          ${page === pages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Next
      </button>
    </div>
  </div>
)}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold mb-4">
                {editing ? "Edit Category" : "Create Category"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatedInput
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({
                      ...form,
                      name,
                      slug: generateSlug(name),
                    })
                  }}
                />

                <AnimatedInput
                  label="Slug"
                  name="slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value })
                  }
                />

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-600"
                  >
                    Cancel
                  </button>

                  <AnimatedButton type="submit">
                    {editing ? "Update" : "Create"}
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}