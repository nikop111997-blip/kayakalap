"use client"

import { useEffect, useRef } from "react"
import toast from "react-hot-toast"

export default function Editor({
  initialData = {},
  onReady,
  onChange,
}) {
  const editorRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const initEditor = async () => {
      if (!isMounted) return
      if (instanceRef.current) return

      const EditorJS = (await import("@editorjs/editorjs")).default
      const Header = (await import("@editorjs/header")).default
      const List = (await import("@editorjs/list")).default
      const Paragraph = (await import("@editorjs/paragraph")).default
      const Quote = (await import("@editorjs/quote")).default
      const Code = (await import("@editorjs/code")).default
      const Delimiter = (await import("@editorjs/delimiter")).default
      const Embed = (await import("@editorjs/embed")).default
      const Table = (await import("@editorjs/table")).default
      const Checklist = (await import("@editorjs/checklist")).default
      const Marker = (await import("@editorjs/marker")).default
      const InlineCode = (await import("@editorjs/inline-code")).default
      const Image = (await import("@editorjs/image")).default
      const Hyperlink = (await import("editorjs-hyperlink")).default

      const editor = new EditorJS({
        holder: editorRef.current,
        data: initialData || {},
        autofocus: true,

        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },

          code: Code,
          delimiter: Delimiter,
          embed: Embed,
          table: Table,
          checklist: Checklist,
          marker: Marker,
          inlineCode: InlineCode,

          // ✅ Inline Link Tool
          hyperlink: {
            class: Hyperlink,
            config: {
              shortcut: "CMD+L",
              target: "_blank",
              rel: "nofollow",
              availableTargets: ["_blank", "_self"],
              availableRels: ["author", "noreferrer"],
              validate: false,
            },
          },

          // ✅ Image Upload with FIXED Validation
          image: {
            class: Image,
            config: {
              uploader: {
                async uploadByFile(file) {
                  const MAX_SIZE = 500 * 1024 // 500KB

                  // ❌ Reject large file (FIXED)
                  if (file.size > MAX_SIZE) {
                    toast.error("Image must be less than 500KB")

                    // 🔥 remove any inserted empty block (extra safety)
                    setTimeout(() => {
                      try {
                        const editorInstance = instanceRef.current
                        if (!editorInstance) return

                        const blocks = editorInstance.blocks
                        const count = blocks.getBlocksCount()

                        if (count > 0) {
                          blocks.delete(count - 1)
                        }
                      } catch (e) {}
                    }, 100)

                    // 🔥 STOP upload completely
                    throw new Error("File too large")
                  }

                  // ✅ Convert to base64
                  return new Promise((resolve) => {
                    const reader = new FileReader()

                    reader.onload = () => {
                      resolve({
                        success: 1,
                        file: {
                          url: reader.result,
                        },
                      })
                    }

                    reader.readAsDataURL(file)
                  })
                },
              },
            },
          },
        },

        async onChange(api) {
          const content = await api.saver.save()
          onChange?.(content)
        },
      })

      instanceRef.current = editor

      editor.isReady.then(() => {
        onReady?.(editor)
      })
    }

    initEditor()

    return () => {
      isMounted = false
      if (instanceRef.current?.destroy) {
        instanceRef.current.destroy()
        instanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={editorRef}
      className="border border-gray-200 p-6 bg-white min-h-[300px]"
    />
  )
}