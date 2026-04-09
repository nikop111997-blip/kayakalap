"use client"

import { motion } from "framer-motion"

export default function EmptyState({
  icon: Icon,
  title = "No data found this time",
  description = "There is no data available.",
  children, // optional custom actions
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 mb-4">
          <Icon className="text-gray-400" size={28} />
        </div>
      )}

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="text-gray-500 text-sm mt-2 mb-6 max-w-sm">
        {description}
      </p>

      {/* Optional custom content (like button) */}
      {children}
    </motion.div>
  )
}