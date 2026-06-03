"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import BackButton from "@/lib/BackButton";

export default function TestimonialForm() {
  const [formData, setFormData] = useState({
    name: "",
    testimonial: "",
    age: "",
    location: "",
    youtubeUrl: "",
    image: null,
  });

  const [hasVideo, setHasVideo] = useState(false);
  const [hasImage, setHasImage] = useState(false);
const [loading, setLoading] = useState(false);
const [imagePreview, setImagePreview] = useState("");
const [imageKey, setImageKey] = useState("");
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    let imageUrl = "";

    // 🔹 Upload image to Vercel Blob
    if (hasImage && formData.image) {
      const uploadForm = new FormData();
      uploadForm.append("file", formData.image);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // ✅ Blob URL
      imageUrl = uploadData.url;

      // ✅ Save key for delete
      setImageKey(uploadData.key);

      // ✅ Store preview
      setImagePreview(uploadData.url);
    }

    // 🔹 Final Payload
    const payload = {
      name: formData.name,
      testimonial: formData.testimonial,
      age: formData.age,
      location: formData.location,
      youtubeUrl: hasVideo ? formData.youtubeUrl : "",
      image: imageUrl, // ✅ Blob URL here
    };

    console.log(payload);

    // Example save API
    await fetch("/api/testimonials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    toast.success("Submitted Successfully");
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
const handleDeleteImage = async () => {
  try {
    if (!imageKey) return;

    const res = await fetch(
      `/api/upload?key=${encodeURIComponent(imageKey)}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Delete failed");
    }

    setImagePreview("");
    setImageKey("");

    setFormData((prev) => ({
      ...prev,
      image: null,
    }));

  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};
  return (
    <div className="min-h-screen p-6 font-sans">
      {/* Main Container matching the resignation form style */}
      <div className="w-full bg-white text-gray-800 overflow-hidden">
        <BackButton/>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Add Testimonials</h2>
            <p className="text-sm text-gray-500 mt-1">Add the testimonials for the website </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Form Content */}
          <div className="p-6 space-y-6">
            
            {/* Required Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Testimonial</label>
              <textarea
                name="testimonial"
                required
                rows="4"
                value={formData.testimonial}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Tell us about your experience..."
              />
            </div>

            {/* Optional Fields Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Age <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. 28"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>

            <div className="pt-2 space-y-6 border-t border-gray-100">
              
              {/* Video Toggle & Input */}
              <div>
                <div className="flex items-center justify-between mb-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Include a video review</label>
                    <p className="text-xs text-gray-400 mt-0.5">Share a YouTube link of your testimonial</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasVideo(!hasVideo)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasVideo ? 'bg-[#05335c]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVideo ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {hasVideo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-2">
                        <input
                          type="url"
                          name="youtubeUrl"
                          value={formData.youtubeUrl}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image Toggle & Input */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload a Testimonial Photo</label>
                    <p className="text-xs text-gray-400 mt-0.5">Upload the Screenshot of the testimonial</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasImage(!hasImage)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasImage ? 'bg-[#05335c]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasImage ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {hasImage && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-2">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        {formData.image && (
                          <p className="mt-2 text-sm text-blue-600 font-medium">Selected: {formData.image.name}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {imagePreview && (
  <div className="mt-4 relative">
    <img
      src={imagePreview}
      alt="Preview"
      className="w-32 h-32 object-cover rounded-xl border"
    />

    <button
      type="button"
      onClick={handleDeleteImage}
      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
    >
      Delete
    </button>
  </div>
)}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 flex items-center gap-3 justify-end space-x-3 bg-gray-50/50">
            <button 
              type="button" 
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#05335c] rounded-lg hover:bg-[#0f2e49] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
            >
              Submit Testimonial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}