"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import BlogForm from "@/component/BlogFrom"
import { apiRequest } from "@/lib/api"
import AccessDenied from "@/component/AccessDenied"
import toast from "react-hot-toast"
import BackButton from "@/lib/BackButton"

export default function EditBlogPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [blog, setBlog] = useState(null)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const blogRes = await apiRequest(`/api/content/blog/${id}`)
      const catRes = await apiRequest("/api/content/categories")

      if (
        blogRes.unauthorized ||
        catRes.unauthorized
      ) {
        setUnauthorized(true)
        return
      }

      if (blogRes.error) {
        toast.error(blogRes.error)
        router.push("/dashboard/blogs")
        return
      }
console.log(blogRes)
      setBlog(blogRes.data)
      setCategories(catRes.data.data || [])

      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleUpdate = async (data) => {
    setSaving(true)

    const res = await apiRequest(`/api/content/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    setSaving(false)

    if (res.unauthorized) {
      setUnauthorized(true)
      return
    }

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success("Blog updated successfully")
    router.push("/dashboard/blogs")
  }

  if (unauthorized) return <AccessDenied />
  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 bg-white min-h-screen w-full font-sans">
      <BackButton />
      <div className="bg-white mt-3 ">
        <h1 className="text-2xl font-semibold mb-6">
          Edit Blog
        </h1>

        <BlogForm
          initialData={blog}
          onSubmit={handleUpdate}
          loading={saving}
          categories={categories}
          authors={authors}
        />
      </div>
    </div>
  )
}