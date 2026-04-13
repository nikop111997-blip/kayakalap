"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BlogForm from "@/component/BlogFrom"
import { apiRequest } from "@/lib/api"
import AccessDenied from "@/component/AccessDenied"
import toast from "react-hot-toast"

export default function CreateBlogPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])

  // Fetch categories & authors
useEffect(() => {
  const fetchData = async () => {
    const catRes = await apiRequest("/api/content/categories")

    if (catRes.unauthorized) {
      setUnauthorized(true)
      return
    }

    if (catRes.error) {
      console.error(catRes.error)
      return
    }

    if (catRes.data?.data) {
      setCategories(catRes.data.data || [])
    }
  }

  fetchData()
}, [])

  const handleCreate = async (data) => {
    setLoading(true)

    const res = await apiRequest("/api/content/blog", {
      method: "POST",
      body: JSON.stringify(data),
    })

    setLoading(false)

    if (res.unauthorized) {
      setUnauthorized(true)
      return
    }

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success("Blog created successfully")
    router.push("/blogs")
  }

  if (unauthorized) return <AccessDenied />

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-full font-sans">
      <div className="">
        <h1 className="text-2xl font-semibold mb-6">
          Create Blog
        </h1>

        <BlogForm
          onSubmit={handleCreate}
          loading={loading}
          categories={categories}
        />
      </div>
    </div>
  )
}