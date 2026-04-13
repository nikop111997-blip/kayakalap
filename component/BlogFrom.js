"use client"

import { useState } from "react"
import AnimatedInput from "@/component/Input"
import AnimatedButton from "@/component/Button"
import { generateSlug } from "@/lib/generateSlug"
import Editor from "./Editor"

export default function BlogForm({
  initialData = {},
  onSubmit,
  loading = false,
  categories = [],
}) {
  const [form, setForm] = useState({
    title: initialData.title || "",
    slug: initialData.slug || "",
    status: initialData.status || "draft",
    category: initialData.category || "",
    metaTitle: initialData.metaTitle || "",
    metaDescription: initialData.metaDescription || "",

    featuredImage: initialData.featuredImage || "",
    featuredImageKey: initialData.featuredImageKey || "",
    featuredImageAlt: initialData.featuredImageAlt || "",
    featuredImageTitle: initialData.featuredImageTitle || "",

    content: initialData.content || {},
  })

  // ================= HANDLE INPUT CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "title") {
      setForm((prev) => ({
        ...prev,
        title: value,
        slug: generateSlug(value),
      }))
      return
    }

    // SEO Limits
    if (name === "metaTitle" && value.length > 60) return
    if (name === "metaDescription" && value.length > 160) return

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ================= IMAGE UPLOAD =================
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error("Upload failed");

    // ✅ USE CORRECT VALUES FROM API
    const imageUrl = data.url;
    const key = data.key;

    setForm((prev) => ({
      ...prev,
      featuredImage: imageUrl,     // full URL
      featuredImageKey: key,       // already correct key
    }));

  } catch (err) {
    console.error("Upload error:", err);
  }
};

  // ================= REMOVE IMAGE =================
  const handleRemoveImage = async () => {
  try {
    if (form.featuredImageKey) {
      await fetch(`/api/upload?key=${form.featuredImageKey}`, {
        method: "DELETE",
      });
    }

    setForm((prev) => ({
      ...prev,
      featuredImage: "",
      featuredImageKey: "",
      featuredImageAlt: "",
      featuredImageTitle: "",
    }));
  } catch (err) {
    console.error("Delete failed", err);
  }
};

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* ================= MAIN COLUMN (LEFT) ================= */}
      <div className="lg:col-span-2 space-y-2">
        
        {/* Basic Info */}
        <div className="space-y-6 flex gap-4">
          <AnimatedInput
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          <AnimatedInput
            label="Slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700">
            Content
          </label>
          <div className="border border-gray-300 rounded-2xl bg-white overflow-hidden">
            <Editor
              initialData={form.content}
              onChange={(content) =>
                setForm((prev) => ({ ...prev, content }))
              }
            />
          </div>
        </div>
      </div>


      {/* ================= SIDEBAR (RIGHT) ================= */}
      <div className="space-y-6">

        {/* Publish & Status Card */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Publishing</h3>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <AnimatedButton
            type="submit"
            isLoading={loading}
            className="w-full mt-4"
          >
            Save Blog
          </AnimatedButton>
        </div>

        {/* Category Card */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Category</h3>
          <div>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured Image Card */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <div className="flex flex-col border-b pb-2 gap-1">
            <h3 className="text-sm font-semibold text-gray-800">Featured Image</h3>
            <p className="text-[10px] text-red-500">Recommended: 1200x400</p>
          </div>

          {!form.featuredImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <img
                  src={`${form.featuredImage}`}
                  alt="Preview"
                  className="rounded-xl w-full h-auto object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-full shadow-md transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <AnimatedInput
                  label="Alt Text"
                  name="featuredImageAlt"
                  value={form.featuredImageAlt}
                  onChange={handleChange}
                />
                <AnimatedInput
                  label="Image Title"
                  name="featuredImageTitle"
                  value={form.featuredImageTitle}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* SEO Settings Card */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">SEO Settings</h3>
          
          <div>
            <AnimatedInput
              label="Meta Title"
              name="metaTitle"
              value={form.metaTitle}
              onChange={handleChange}
            />
            <div className="flex justify-between text-[10px] mt-1.5 px-1">
              <span className="text-gray-400">Target: 50–60 chars</span>
              <span
                className={`${
                  form.metaTitle.length > 55
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}
              >
                {form.metaTitle.length}/60
              </span>
            </div>
          </div>

          <div>
            <AnimatedInput
              label="Meta Description"
              name="metaDescription"
              value={form.metaDescription}
              onChange={handleChange}
            />
            <div className="flex justify-between text-[10px] mt-1.5 px-1">
              <span className="text-gray-400">Target: 150–160 chars</span>
              <span
                className={`${
                  form.metaDescription.length > 150
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}
              >
                {form.metaDescription.length}/160
              </span>
            </div>
          </div>
        </div>

      </div>

    </form>
  )
}