"use client"

import { motion, AnimatePresence } from "framer-motion"
import AnimatedButton from "./Button"

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Confirm Action",
  description = "Are you sure?"
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 w-[420px] shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2">
              {title}
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              {description}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <AnimatedButton
                onClick={onConfirm}
                isLoading={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AnimatedButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}