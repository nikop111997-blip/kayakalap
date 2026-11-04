"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  LayoutTemplate, 
  Type, 
  Image as ImageIcon, 
  MousePointerClick, 
  Columns, 
  Minus, 
  Smartphone, 
  Monitor, 
  Code,
  Download,
  Loader2,
  Rss,
  Layers,
  Trash2,
  Save,
  CheckCircle2,
  Paintbrush,
  Settings,
  ListTree,
  Undo2,
  Redo2,
  Eye,
  Pencil
} from "lucide-react";

export default function EmailBuilder() {
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [isGrapesLoaded, setIsGrapesLoaded] = useState(false);
  
  // UI State
  const [activeLeftTab, setActiveLeftTab] = useState("blocks"); // 'blocks', 'blogs'
  const [activeRightTab, setActiveRightTab] = useState("styles"); // 'styles', 'traits', 'layers'
  const [deviceMode, setDeviceMode] = useState("Desktop");
  const [isPreview, setIsPreview] = useState(false);
  const [templateName, setTemplateName] = useState("Premium Email Template");
  
  // Data State
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.grapesjs) {
      setIsGrapesLoaded(true);
      return;
    }
    
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/grapesjs/dist/css/grapes.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/grapesjs";
    script.onload = () => setIsGrapesLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isGrapesLoaded || !editorRef.current) return;

    // Helper for SVG icons in blocks
    const svgIcon = (path, size="24") => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

    const editor = window.grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "100%",
      fromElement: false,
      storageManager: false, 
      panels: { defaults: [] }, 
      
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'mobile', name: 'Mobile', width: '320px', widthMedia: '480px' },
        ]
      },

      selectorManager: { appendTo: '#gjs-styles' },
      layerManager: { appendTo: '#gjs-layers' },
      traitManager: { appendTo: '#gjs-traits' },
      
      styleManager: { 
        appendTo: '#gjs-styles',
        sectors: [
          {
            name: 'Layout & Sizing',
            open: true,
            buildProps: ['width', 'height', 'max-width', 'min-height', 'display', 'flex-direction', 'justify-content', 'align-items'],
            properties: [
              { type: 'slider', property: 'width', units: ['px', '%', 'vw'], min: 0, max: 1200, step: 1 },
              { type: 'slider', property: 'height', units: ['px', '%', 'vh'], min: 0, max: 1200, step: 1 },
              { type: 'slider', property: 'max-width', units: ['px', '%'], min: 0, max: 1200, step: 1 },
              { type: 'slider', property: 'min-height', units: ['px', '%'], min: 0, max: 1200, step: 1 },
            ]
          },
          {
            name: 'Spacing (Padding & Margin)',
            open: true,
            buildProps: ['margin', 'padding'],
            properties: [
              { property: 'margin', type: 'composite', properties: [
                  { type: 'slider', property: 'margin-top', units: ['px', '%'], min: -100, max: 200 },
                  { type: 'slider', property: 'margin-right', units: ['px', '%'], min: -100, max: 200 },
                  { type: 'slider', property: 'margin-bottom', units: ['px', '%'], min: -100, max: 200 },
                  { type: 'slider', property: 'margin-left', units: ['px', '%'], min: -100, max: 200 },
                ]
              },
              { property: 'padding', type: 'composite', properties: [
                  { type: 'slider', property: 'padding-top', units: ['px', '%'], min: 0, max: 200 },
                  { type: 'slider', property: 'padding-right', units: ['px', '%'], min: 0, max: 200 },
                  { type: 'slider', property: 'padding-bottom', units: ['px', '%'], min: 0, max: 200 },
                  { type: 'slider', property: 'padding-left', units: ['px', '%'], min: 0, max: 200 },
                ]
              }
            ]
          },
          {
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align'],
            properties: [
              { type: 'slider', property: 'font-size', units: ['px', 'em', 'rem'], min: 8, max: 120, step: 1 },
              { type: 'slider', property: 'line-height', units: ['px', 'em', '-'], min: 0, max: 5, step: 0.1 },
              { type: 'color', property: 'color' },
              { type: 'select', property: 'text-align', options: [
                  { id: 'left', label: 'Left' },
                  { id: 'center', label: 'Center' },
                  { id: 'right', label: 'Right' },
                  { id: 'justify', label: 'Justify' }
              ]},
              { type: 'select', property: 'font-family', options: [
                { id: '"Inter", sans-serif', label: 'Inter' },
                { id: 'Arial, Helvetica, sans-serif', label: 'Arial' },
                { id: '"Arial Black", Gadget, sans-serif', label: 'Arial Black' },
                { id: 'Georgia, serif', label: 'Georgia' },
                { id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
                { id: '"Times New Roman", Times, serif', label: 'Times New Roman' },
                { id: 'Verdana, Geneva, sans-serif', label: 'Verdana' }
              ]}
            ]
          },
          {
            name: 'Background & Borders',
            open: false,
            buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background-image'],
            properties: [
              { type: 'color', property: 'background-color' },
              { type: 'slider', property: 'border-radius', units: ['px', '%'], min: 0, max: 100, step: 1 },
            ]
          }
        ]
      },
      
      assetManager: {
        uploadFile: async (e) => {
          const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
          if (!files || files.length === 0) return;
          const formData = new FormData();
          formData.append("file", files[0]);
          try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) {
              editor.AssetManager.add({ src: data.url, name: files[0].name });
            } else {
              alert("Image upload failed");
            }
          } catch (error) {
            console.error(error);
          }
        }
      },
      
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
          `body { font-family: "Inter", Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; }`,
          `* { box-sizing: border-box; }`,
          `img { max-width: 100%; height: auto; border: 0; display: block; outline: none; }`,
          `a { text-decoration: none; color: #3b82f6; }`,
          `table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }`,
          `td { padding: 0; }`,
          `.main-wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 10px; }`,
          `.email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }`,
          /* Mobile Responsiveness for Column Drops */
          `@media only screen and (max-width: 480px) {
            .mobile-stack { display: block !important; width: 100% !important; padding: 10px 0 !important; }
            .mobile-center { text-align: center !important; }
            .mobile-hide { display: none !important; }
            .main-wrapper { padding: 10px !important; }
          }`
        ]
      },

      blockManager: {
        appendTo: "#gjs-blocks",
        blocks: [
          // ----------------------------------------------------
          // 1. HEADERS (5)
          // ----------------------------------------------------
          {
            id: "header-logo-center", category: "Headers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="8" width="18" height="8" rx="2"/><circle cx="12" cy="12" r="2"/>')}<span class="text-xs text-center">Logo Center</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;"><tr><td align="center" style="padding: 30px 20px;" data-gjs-droppable="true"><img src="https://via.placeholder.com/150x50?text=YOUR+LOGO" width="150" alt="Logo" style="display:block; margin:0 auto;" /></td></tr></table>`,
          },
          {
            id: "header-logo-nav", category: "Headers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 12h2m4 0h4"/>')}<span class="text-xs text-center">Logo + Nav</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; padding: 20px;">
                <tr>
                  <td width="30%" align="left" class="mobile-stack" style="padding: 10px 20px;" data-gjs-droppable="true"><img src="https://via.placeholder.com/120x40?text=LOGO" width="120" alt="Logo" /></td>
                  <td width="70%" align="right" class="mobile-stack mobile-center" style="padding: 10px 20px;" data-gjs-droppable="true">
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; color:#4b5563; margin-left:15px;">Shop</a>
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; color:#4b5563; margin-left:15px;">About</a>
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; color:#4b5563; margin-left:15px;">Contact</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "header-dark", category: "Headers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="8" width="18" height="8" rx="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="white"/>')}<span class="text-xs text-center">Dark Header</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#111827;"><tr><td align="center" style="padding: 30px 20px;" data-gjs-droppable="true"><img src="https://via.placeholder.com/150x50/111827/ffffff?text=WHITE+LOGO" width="150" alt="Logo" style="display:block; margin:0 auto;" /></td></tr></table>`,
          },
          {
            id: "header-preheader", category: "Headers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<path d="M3 6h18M3 12h18M3 18h18"/>')}<span class="text-xs text-center">Pre-Header</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;"><tr><td align="center" style="padding: 10px 20px; font-family:'Inter',sans-serif; font-size:12px; color:#6b7280;" data-gjs-droppable="true">Can't read this email? <a href="#" style="color:#3b82f6;">View in browser</a></td></tr></table>`,
          },
          {
            id: "header-hero", category: "Headers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/>')}<span class="text-xs text-center">Hero Bg</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" background="https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=300&fit=crop" style="background-color:#3b82f6; background-size: cover; background-position: center;">
                <tr>
                  <td align="center" style="padding: 80px 20px;" data-gjs-droppable="true">
                    <h1 style="font-family:'Inter',sans-serif; font-size:36px; font-weight:800; color:#ffffff; margin:0 0 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Big Announcement</h1>
                    <p style="font-family:'Inter',sans-serif; font-size:18px; color:#f3f4f6; margin:0; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">The wait is finally over.</p>
                  </td>
                </tr>
              </table>`,
          },

          // ----------------------------------------------------
          // 2. LAYOUTS (6) -> Enable Row & Column D&D via droppable TD
          // ----------------------------------------------------
          {
            id: "layout-1col", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="4" y="6" width="16" height="12" rx="2"/>')}<span class="text-xs text-center">1 Column</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Column"></td></tr></table>`,
          },
          {
            id: "layout-2col", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="6" width="8" height="12" rx="1"/><rect x="13" y="6" width="8" height="12" rx="1"/>')}<span class="text-xs text-center">2 Cols (1/2)</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Left Col"></td>
                  <td width="50%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Right Col"></td>
                </tr>
              </table>`,
          },
          {
            id: "layout-2col-1-2", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="6" width="6" height="12" rx="1"/><rect x="11" y="6" width="10" height="12" rx="1"/>')}<span class="text-xs text-center">2 Cols (1/3)</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Left Col"></td>
                  <td width="66.66%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Right Col"></td>
                </tr>
              </table>`,
          },
          {
            id: "layout-2col-2-1", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="6" width="10" height="12" rx="1"/><rect x="15" y="6" width="6" height="12" rx="1"/>')}<span class="text-xs text-center">2 Cols (2/3)</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="66.66%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Left Col"></td>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true" data-gjs-custom-name="Right Col"></td>
                </tr>
              </table>`,
          },
          {
            id: "layout-3col", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="2" y="6" width="5" height="12" rx="1"/><rect x="9" y="6" width="6" height="12" rx="1"/><rect x="17" y="6" width="5" height="12" rx="1"/>')}<span class="text-xs text-center">3 Columns</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding:15px;" data-gjs-droppable="true" data-gjs-custom-name="Col 1"></td>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding:15px;" data-gjs-droppable="true" data-gjs-custom-name="Col 2"></td>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding:15px;" data-gjs-droppable="true" data-gjs-custom-name="Col 3"></td>
                </tr>
              </table>`,
          },
          {
            id: "layout-4col", category: "Layouts",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="2" y="8" width="4" height="8" rx="1"/><rect x="7.5" y="8" width="4" height="8" rx="1"/><rect x="13" y="8" width="4" height="8" rx="1"/><rect x="18.5" y="8" width="4" height="8" rx="1"/>')}<span class="text-xs text-center">4 Columns</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="25%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true"></td>
                  <td width="25%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true"></td>
                  <td width="25%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true"></td>
                  <td width="25%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true"></td>
                </tr>
              </table>`,
          },

          // ----------------------------------------------------
          // 3. TYPOGRAPHY (7)
          // ----------------------------------------------------
          {
            id: "typo-h1", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><strong class="text-xl leading-none">H1</strong><span class="text-xs text-center">Title 1</span></div>`,
            content: `<h1 style="font-family:'Inter',sans-serif; font-size:32px; font-weight:800; color:#111827; margin:0 0 20px 0; line-height:1.2;">Main Heading</h1>`,
          },
          {
            id: "typo-h2", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><strong class="text-lg leading-none">H2</strong><span class="text-xs text-center">Title 2</span></div>`,
            content: `<h2 style="font-family:'Inter',sans-serif; font-size:24px; font-weight:700; color:#1f2937; margin:0 0 15px 0; line-height:1.3;">Secondary Heading</h2>`,
          },
          {
            id: "typo-h3", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><strong class="text-base leading-none">H3</strong><span class="text-xs text-center">Title 3</span></div>`,
            content: `<h3 style="font-family:'Inter',sans-serif; font-size:18px; font-weight:600; color:#374151; margin:0 0 12px 0; line-height:1.4;">Section Heading</h3>`,
          },
          {
            id: "typo-p", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>')}<span class="text-xs text-center">Paragraph</span></div>`,
            content: `<p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; color:#4b5563; margin:0 0 16px 0; line-height:1.6;">This is a paragraph of text. It is designed to be highly readable on both desktop and mobile devices. You can edit this text by clicking on it.</p>`,
          },
          {
            id: "typo-quote", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.036c0 1.028 1 2.964 1 2.964z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 1 1 1 1z"/>')}<span class="text-xs text-center">Quote</span></div>`,
            content: `<blockquote style="font-family:'Georgia',serif; font-size:18px; font-style:italic; color:#4b5563; margin:20px 0; padding:15px 20px; border-left:4px solid #3b82f6; background-color:#eff6ff;">"This is a powerful testimonial or quote that draws attention."<br><br><span style="font-size:14px; font-style:normal; font-family:'Inter',sans-serif; font-weight:600;">- Jane Doe, CEO</span></blockquote>`,
          },
          {
            id: "typo-list-ul", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>')}<span class="text-xs text-center">Bullets</span></div>`,
            content: `<ul style="font-family:'Inter',sans-serif; font-size:16px; color:#4b5563; line-height:1.6; padding-left:20px; margin:0 0 20px 0;"><li style="margin-bottom:8px;">First key benefit or point</li><li style="margin-bottom:8px;">Second important detail</li><li style="margin-bottom:8px;">Third awesome feature</li></ul>`,
          },
          {
            id: "typo-list-ol", category: "Typography",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>')}<span class="text-xs text-center">Numbers</span></div>`,
            content: `<ol style="font-family:'Inter',sans-serif; font-size:16px; color:#4b5563; line-height:1.6; padding-left:20px; margin:0 0 20px 0;"><li style="margin-bottom:8px;">Step one to success</li><li style="margin-bottom:8px;">Step two in the process</li><li style="margin-bottom:8px;">Final completion step</li></ol>`,
          },

          // ----------------------------------------------------
          // 4. MEDIA (4)
          // ----------------------------------------------------
          {
            id: "media-img-full", category: "Media",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>')}<span class="text-xs text-center">Image</span></div>`,
            content: { type: 'image', style: { width: '100%', 'max-width': '100%', height: 'auto', display: 'block', margin: '0 0 15px 0', 'border-radius': '6px' }, activeOnRender: 1 },
          },
          {
            id: "media-img-caption", category: "Media",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="3" width="18" height="14" rx="2"/><line x1="6" y1="21" x2="18" y2="21"/>')}<span class="text-xs text-center">Img + Text</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr><td data-gjs-droppable="true"><img src="https://via.placeholder.com/600x300" style="width:100%; border-radius:6px 6px 0 0; display:block;" /></td></tr>
                <tr><td align="center" style="background-color:#f9fafb; padding:12px; border-radius:0 0 6px 6px; font-family:'Inter',sans-serif; font-size:13px; color:#6b7280;" data-gjs-droppable="true">A descriptive caption for this image</td></tr>
              </table>`,
          },
          {
            id: "media-video", category: "Media",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3v-6z"/>')}<span class="text-xs text-center">Video Link</span></div>`,
            content: `
              <a href="#" style="display:block; text-decoration:none; margin-bottom:20px; position:relative;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" background="https://via.placeholder.com/600x320/111827/ffffff?text=Video+Thumbnail" style="background-color:#111827; background-size:cover; border-radius:8px; height:320px;">
                  <tr><td align="center" valign="middle" data-gjs-droppable="true"><img src="https://img.icons8.com/color/96/play--v1.png" width="64" alt="Play" style="display:block;"/></td></tr>
                </table>
              </a>`,
          },
          {
            id: "media-gif", category: "Media",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8m-4-4v8"/>')}<span class="text-xs text-center">GIF Block</span></div>`,
            content: `<img src="https://media.giphy.com/media/xUPGGDNsLvqsBOhuU0/giphy.gif" style="width:100%; max-width:600px; border-radius:8px; display:block; margin:0 auto 20px auto;" alt="Animated GIF" />`,
          },

          // ----------------------------------------------------
          // 5. BUTTONS & ACTIONS (6)
          // ----------------------------------------------------
          {
            id: "btn-primary", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="8" width="18" height="8" rx="4" fill="#3b82f6"/>')}<span class="text-xs text-center">Primary Btn</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin:10px 0 20px 0;">
                <tr>
                  <td align="center" style="border-radius:6px; background-color:#2563eb;" data-gjs-droppable="true">
                    <a href="#" target="_blank" style="font-family:'Inter',sans-serif; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; padding:14px 28px; border:1px solid #2563eb; display:inline-block; border-radius:6px;">Call to Action</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "btn-outline", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="8" width="18" height="8" rx="4"/>')}<span class="text-xs text-center">Outline Btn</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin:10px 0 20px 0;">
                <tr>
                  <td align="center" style="border-radius:6px; background-color:transparent;" data-gjs-droppable="true">
                    <a href="#" target="_blank" style="font-family:'Inter',sans-serif; font-size:16px; font-weight:600; color:#2563eb; text-decoration:none; padding:14px 28px; border:2px solid #2563eb; display:inline-block; border-radius:6px;">Learn More</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "btn-full", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="1" y="8" width="22" height="8" rx="2" fill="#111827"/>')}<span class="text-xs text-center">Full Width</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:10px 0 20px 0;">
                <tr>
                  <td align="center" style="border-radius:6px; background-color:#111827;" data-gjs-droppable="true">
                    <a href="#" target="_blank" style="font-family:'Inter',sans-serif; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; padding:16px 20px; display:block; text-align:center; border-radius:6px;">Subscribe Now</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "btn-appstore", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="16" r="1"/>')}<span class="text-xs text-center">App Badges</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin:15px 0;">
                <tr>
                  <td style="padding-right:10px;" data-gjs-droppable="true"><a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" width="135" height="40" alt="App Store" style="display:block;"/></a></td>
                  <td data-gjs-droppable="true"><a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" width="135" height="40" alt="Google Play" style="display:block;"/></a></td>
                </tr>
              </table>`,
          },
          {
            id: "btn-social-std", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>')}<span class="text-xs text-center">Social Basic</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="https://www.facebook.com/KayapalatWellness/"><img src="https://img.icons8.com/ios-filled/50/4b5563/facebook-new.png" width="24" height="24" alt="Facebook" style="display:block;" /></a></td>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="https://x.com/kayapalatWL"><img src="https://img.icons8.com/ios-filled/50/4b5563/twitterx--v2.png" width="24" height="24" alt="X" style="display:block;" /></a></td>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="https://www.instagram.com/kayapalatwellness/?hl=en"><img src="https://img.icons8.com/ios-filled/50/4b5563/instagram-new.png" width="24" height="24" alt="Instagram" style="display:block;" /></a></td>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="https://www.linkedin.com/company/kayapalat-wellness/"><img src="https://img.icons8.com/ios-filled/50/4b5563/linkedin.png" width="24" height="24" alt="LinkedIn" style="display:block;" /></a></td>
                </tr>
              </table>`,
          },
          {
            id: "btn-social-color", category: "Actions",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<circle cx="6" cy="12" r="3" fill="#cbd5e1"/><circle cx="14" cy="12" r="3" fill="#cbd5e1"/>')}<span class="text-xs text-center">Social Color</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="#"><img src="https://img.icons8.com/color/48/facebook-new.png" width="32" height="32" alt="Facebook" style="display:block;" /></a></td>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="#"><img src="https://img.icons8.com/color/48/twitter--v1.png" width="32" height="32" alt="Twitter" style="display:block;" /></a></td>
                  <td style="padding:0 8px;" data-gjs-droppable="true"><a href="#"><img src="https://img.icons8.com/color/48/instagram-new--v1.png" width="32" height="32" alt="Instagram" style="display:block;" /></a></td>
                </tr>
              </table>`,
          },

          // ----------------------------------------------------
          // 6. DIVIDERS & SPACERS (4)
          // ----------------------------------------------------
          {
            id: "div-solid", category: "Spacers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="3" y1="12" x2="21" y2="12"/>')}<span class="text-xs text-center">Solid Line</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding:20px 0;"><hr style="border:0; border-top:1px solid #e5e7eb; margin:0; width:100%;" /></td></tr></table>`,
          },
          {
            id: "div-dashed", category: "Spacers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="3" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/>')}<span class="text-xs text-center">Dashed Line</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding:20px 0;"><hr style="border:0; border-top:2px dashed #d1d5db; margin:0; width:100%;" /></td></tr></table>`,
          },
          {
            id: "space-20", category: "Spacers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="8" y="8" width="8" height="8" rx="1"/>')}<span class="text-xs text-center">Space (20px)</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="height:20px; line-height:20px; font-size:20px;">&nbsp;</td></tr></table>`,
          },
          {
            id: "space-40", category: "Spacers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="8" y="4" width="8" height="16" rx="1"/>')}<span class="text-xs text-center">Space (40px)</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="height:40px; line-height:40px; font-size:40px;">&nbsp;</td></tr></table>`,
          },

          // ----------------------------------------------------
          // 7. E-COMMERCE (4)
          // ----------------------------------------------------
          {
            id: "ecom-single", category: "E-commerce",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>')}<span class="text-xs text-center">Product</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:8px; margin-bottom:20px; background-color:#ffffff;">
                <tr><td align="center" style="padding:20px;" data-gjs-droppable="true"><img src="https://via.placeholder.com/300x300?text=Product+Image" style="width:100%; max-width:250px; display:block; border-radius:4px;" /></td></tr>
                <tr>
                  <td align="center" style="padding:0 20px 20px 20px;" data-gjs-droppable="true">
                    <h3 style="font-family:'Inter',sans-serif; font-size:20px; font-weight:700; color:#111827; margin:0 0 5px 0;">Premium Wireless Headphones</h3>
                    <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:600; color:#10b981; margin:0 0 15px 0;">$149.99 <s style="color:#9ca3af; font-size:14px; margin-left:8px;">$199.99</s></p>
                    <table border="0" cellspacing="0" cellpadding="0"><tr><td align="center" style="background-color:#111827; border-radius:4px;"><a href="#" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; padding:12px 24px; display:block;">Shop Now</a></td></tr></table>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "ecom-grid", category: "E-commerce",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="3" rx="1"/><rect x="14" y="14" width="7" height="3" rx="1"/>')}<span class="text-xs text-center">2 Products</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr>
                  <td width="48%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:6px; background-color:#ffffff; padding:15px;">
                      <tr><td align="center" data-gjs-droppable="true"><img src="https://via.placeholder.com/200" style="width:100%; display:block; margin-bottom:10px; border-radius:4px;" /></td></tr>
                      <tr><td data-gjs-droppable="true"><h4 style="font-family:'Inter',sans-serif; font-size:16px; margin:0 0 5px 0; color:#111827;">Item One</h4><p style="font-family:'Inter',sans-serif; font-size:14px; margin:0 0 10px 0; font-weight:700; color:#2563eb;">$49.00</p><a href="#" style="font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#ffffff; background-color:#111827; text-decoration:none; padding:8px 16px; display:inline-block; border-radius:4px;">Buy</a></td></tr>
                    </table>
                  </td>
                  <td width="4%" class="mobile-hide"></td>
                  <td width="48%" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:6px; background-color:#ffffff; padding:15px;">
                      <tr><td align="center" data-gjs-droppable="true"><img src="https://via.placeholder.com/200" style="width:100%; display:block; margin-bottom:10px; border-radius:4px;" /></td></tr>
                      <tr><td data-gjs-droppable="true"><h4 style="font-family:'Inter',sans-serif; font-size:16px; margin:0 0 5px 0; color:#111827;">Item Two</h4><p style="font-family:'Inter',sans-serif; font-size:14px; margin:0 0 10px 0; font-weight:700; color:#2563eb;">$59.00</p><a href="#" style="font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#ffffff; background-color:#111827; text-decoration:none; padding:8px 16px; display:inline-block; border-radius:4px;">Buy</a></td></tr>
                    </table>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "ecom-discount", category: "E-commerce",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M5 18l14-12"/>')}<span class="text-xs text-center">Discount</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#fee2e2; border-radius:8px; border:2px dashed #ef4444; margin:20px 0;">
                <tr>
                  <td align="center" style="padding:30px 20px;" data-gjs-droppable="true">
                    <h2 style="font-family:'Inter',sans-serif; font-size:24px; font-weight:800; color:#b91c1c; margin:0 0 10px 0; text-transform:uppercase;">Get 20% Off</h2>
                    <p style="font-family:'Inter',sans-serif; font-size:16px; color:#7f1d1d; margin:0 0 15px 0;">Use the code below at checkout.</p>
                    <div style="background-color:#ffffff; border:1px solid #fca5a5; padding:10px 20px; display:inline-block; font-family:'Courier New',monospace; font-size:24px; font-weight:bold; letter-spacing:2px; color:#b91c1c; border-radius:4px;">SAVE20</div>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "ecom-receipt", category: "E-commerce",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>')}<span class="text-xs text-center">Receipt</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:6px; background-color:#ffffff; margin:20px 0; font-family:'Inter',sans-serif; font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #e5e7eb;" data-gjs-droppable="true">
                    <strong style="font-size:16px; color:#111827;">Order Summary (#12345)</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;" data-gjs-droppable="true">
                    <table width="100%" border="0" cellspacing="0" cellpadding="8">
                      <tr><td align="left">Product Item A</td><td align="right">$25.00</td></tr>
                      <tr><td align="left">Product Item B</td><td align="right">$15.00</td></tr>
                      <tr><td align="left" style="color:#6b7280;">Shipping</td><td align="right" style="color:#6b7280;">$5.00</td></tr>
                      <tr><td align="left" style="font-weight:700; color:#111827; border-top:1px solid #e5e7eb; padding-top:15px;">Total</td><td align="right" style="font-weight:700; color:#111827; border-top:1px solid #e5e7eb; padding-top:15px;">$45.00</td></tr>
                    </table>
                  </td>
                </tr>
              </table>`,
          },

          // ----------------------------------------------------
          // 8. CONTENT MODULES (5)
          // ----------------------------------------------------
          {
            id: "content-article-top", category: "Content",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="3" width="18" height="10" rx="1"/><line x1="3" y1="17" x2="21" y2="17"/><line x1="3" y1="21" x2="15" y2="21"/>')}<span class="text-xs text-center">Card Top</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:20px;">
                <tr><td data-gjs-droppable="true"><img src="https://via.placeholder.com/600x300" style="width:100%; display:block;" /></td></tr>
                <tr>
                  <td style="padding:25px;" data-gjs-droppable="true">
                    <h3 style="font-family:'Inter',sans-serif; font-size:22px; font-weight:700; color:#111827; margin:0 0 10px 0;">Article Headline Goes Here</h3>
                    <p style="font-family:'Inter',sans-serif; font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 15px 0;">This is a brief summary of the article content. It provides enough context to make the user want to click and read more.</p>
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#2563eb; text-decoration:none;">Read More &rarr;</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "content-article-left", category: "Content",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="4" width="8" height="16" rx="1"/><line x1="14" y1="8" x2="21" y2="8"/><line x1="14" y1="12" x2="21" y2="12"/><line x1="14" y1="16" x2="18" y2="16"/>')}<span class="text-xs text-center">Card Left</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:20px;">
                <tr>
                  <td width="200" valign="top" class="mobile-stack" data-gjs-droppable="true"><img src="https://via.placeholder.com/200x200" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:8px 0 0 8px;" /></td>
                  <td valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true">
                    <span style="display:inline-block; padding:4px 8px; background-color:#eff6ff; color:#1d4ed8; font-family:'Inter',sans-serif; font-size:11px; font-weight:700; border-radius:4px; margin-bottom:8px; text-transform:uppercase;">News</span>
                    <h3 style="font-family:'Inter',sans-serif; font-size:18px; color:#111827; margin:0 0 10px 0;">Exciting News Update</h3>
                    <p style="font-family:'Inter',sans-serif; font-size:14px; color:#4b5563; line-height:1.5; margin:0 0 15px 0;">Catch up on the latest insights and updates from our team.</p>
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#2563eb; text-decoration:none;">Read More</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "content-article-right", category: "Content",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<line x1="3" y1="8" x2="10" y2="8"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="16" x2="7" y2="16"/><rect x="13" y="4" width="8" height="16" rx="1"/>')}<span class="text-xs text-center">Card Right</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:20px;">
                <tr>
                  <td valign="top" class="mobile-stack" style="padding:20px;" data-gjs-droppable="true">
                    <h3 style="font-family:'Inter',sans-serif; font-size:18px; color:#111827; margin:0 0 10px 0;">Feature Spotlight</h3>
                    <p style="font-family:'Inter',sans-serif; font-size:14px; color:#4b5563; line-height:1.5; margin:0 0 15px 0;">Learn how to use our newest tools to improve your workflow.</p>
                    <a href="#" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#2563eb; text-decoration:none;">Explore Now</a>
                  </td>
                  <td width="200" valign="top" class="mobile-stack" data-gjs-droppable="true"><img src="https://via.placeholder.com/200x200" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:0 8px 8px 0;" /></td>
                </tr>
              </table>`,
          },
          {
            id: "content-steps", category: "Content",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<circle cx="5" cy="6" r="2"/><line x1="10" y1="6" x2="21" y2="6"/><circle cx="5" cy="12" r="2"/><line x1="10" y1="12" x2="21" y2="12"/><circle cx="5" cy="18" r="2"/><line x1="10" y1="18" x2="21" y2="18"/>')}<span class="text-xs text-center">Steps 1-2-3</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;">
                <tr>
                  <td width="33.33%" align="center" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true">
                    <div style="width:40px; height:40px; line-height:40px; background-color:#3b82f6; color:white; border-radius:50%; font-family:'Inter',sans-serif; font-weight:bold; font-size:18px; margin:0 auto 10px auto;">1</div>
                    <h4 style="font-family:'Inter',sans-serif; font-size:16px; margin:0 0 5px 0; color:#111827;">Sign Up</h4>
                    <p style="font-family:'Inter',sans-serif; font-size:13px; color:#6b7280; margin:0;">Create your free account.</p>
                  </td>
                  <td width="33.33%" align="center" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true">
                    <div style="width:40px; height:40px; line-height:40px; background-color:#3b82f6; color:white; border-radius:50%; font-family:'Inter',sans-serif; font-weight:bold; font-size:18px; margin:0 auto 10px auto;">2</div>
                    <h4 style="font-family:'Inter',sans-serif; font-size:16px; margin:0 0 5px 0; color:#111827;">Customize</h4>
                    <p style="font-family:'Inter',sans-serif; font-size:13px; color:#6b7280; margin:0;">Make it look exactly like your brand.</p>
                  </td>
                  <td width="33.33%" align="center" valign="top" class="mobile-stack" style="padding:10px;" data-gjs-droppable="true">
                    <div style="width:40px; height:40px; line-height:40px; background-color:#3b82f6; color:white; border-radius:50%; font-family:'Inter',sans-serif; font-weight:bold; font-size:18px; margin:0 auto 10px auto;">3</div>
                    <h4 style="font-family:'Inter',sans-serif; font-size:16px; margin:0 0 5px 0; color:#111827;">Launch</h4>
                    <p style="font-family:'Inter',sans-serif; font-size:13px; color:#6b7280; margin:0;">Send it out to the world.</p>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "content-faq", category: "Content",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>')}<span class="text-xs text-center">FAQ Block</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:20px 0; font-family:'Inter',sans-serif;">
                <tr><td style="padding-bottom:15px;" data-gjs-droppable="true"><h4 style="margin:0 0 5px 0; font-size:16px; color:#111827;">How do I reset my password?</h4><p style="margin:0; font-size:14px; color:#4b5563; line-height:1.5;">You can click the 'Forgot Password' link on the login screen to receive a reset email.</p></td></tr>
                <tr><td style="padding-bottom:15px; border-top:1px solid #e5e7eb; padding-top:15px;" data-gjs-droppable="true"><h4 style="margin:0 0 5px 0; font-size:16px; color:#111827;">What is the refund policy?</h4><p style="margin:0; font-size:14px; color:#4b5563; line-height:1.5;">We offer a 30-day money-back guarantee on all premium plans.</p></td></tr>
              </table>`,
          },

          // ----------------------------------------------------
          // 9. FOOTERS (4)
          // ----------------------------------------------------
          {
            id: "footer-simple", category: "Footers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="14" width="18" height="6" rx="2"/><line x1="7" y1="17" x2="17" y2="17"/>')}<span class="text-xs text-center">Basic Footer</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px;">
                <tr>
                  <td align="center" style="padding:20px; font-family:'Inter',sans-serif; font-size:12px; color:#9ca3af; line-height:1.6;" data-gjs-droppable="true">
                    <p style="margin:0 0 10px 0;">© 2026 Kayapalat. All rights reserved.</p>
                    <p style="margin:0 0 10px 0;">Sethi Building, 209, Kotri Rd, adjacent to central square mall, Ballabhbari, Gumanpura, Kota, Rajasthan 324007</p>
                    <a href="{{unsubscribe_link}}" style="color:#6b7280; text-decoration:underline;">Unsubscribe</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "footer-links", category: "Footers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="12" width="18" height="8" rx="2"/><circle cx="8" cy="16" r="1"/><circle cx="12" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>')}<span class="text-xs text-center">Links Footer</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px; border-top:1px solid #e5e7eb;">
                <tr>
                  <td align="center" style="padding:30px 20px;" data-gjs-droppable="true">
                    <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="padding:0 10px;"><a href="/privacy-policy" style="font-family:'Inter',sans-serif; font-size:13px; color:#4b5563; text-decoration:none;">Privacy Policy</a></td>
                        <td style="padding:0 10px;"><a href="/terms-of-service" style="font-family:'Inter',sans-serif; font-size:13px; color:#4b5563; text-decoration:none;">Terms of Service</a></td>
                        <td style="padding:0 10px;"><a href="/contact-us" style="font-family:'Inter',sans-serif; font-size:13px; color:#4b5563; text-decoration:none;">Contact Us</a></td>
                      </tr>
                    </table>
                    <p style="font-family:'Inter',sans-serif; font-size:12px; color:#9ca3af; margin:0 0 10px 0;">© 2026 Kayapalat. All rights reserved.</p>
                    <a href="{{unsubscribe_link}}" style="font-family:'Inter',sans-serif; font-size:12px; color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
                  </td>
                </tr>
              </table>`,
          },
          {
            id: "footer-dark", category: "Footers",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600">${svgIcon('<rect x="3" y="14" width="18" height="6" rx="2" fill="currentColor"/><line x1="7" y1="17" x2="17" y2="17" stroke="white"/>')}<span class="text-xs text-center">Dark Footer</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#111827; margin-top:30px; border-radius:0 0 8px 8px;">
                <tr>
                  <td align="center" style="padding:40px 20px; font-family:'Inter',sans-serif; font-size:12px; color:#9ca3af; line-height:1.6;" data-gjs-droppable="true">
                    <img src="https://www.kayapalat.in/_next/image?url=https%3A%2F%2Fframerusercontent.com%2Fimages%2FmsjGzrRn1eu9rQWQOuvoSNpE2yE.png%3Fscale-down-to%3D512%26width%3D644%26height%3D164&w=256&q=75" width="100" style="margin-bottom:20px; display:block;" />
                    <p style="margin:0 0 10px 0;">© 2026 Kayapalat. All rights reserved.</p>
                    <p style="margin:0 0 10px 0;">Sethi Building, 209, Kotri Rd, adjacent to central square mall, Ballabhbari, Gumanpura, Kota, Rajasthan 324007</p>
                    <a href="{{unsubscribe_link}}" style="color:#d1d5db; text-decoration:underline;">Unsubscribe</a>
                  </td>
                </tr>
              </table>`,
          }
        ],
      },
    });

    editor.on('load', () => {
      editor.setDevice('desktop');
      if (!editor.getHtml()) {
        editor.addComponents(`<table class="main-wrapper" width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td align="center"><table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding: 40px;" min-height="400px" data-gjs-droppable="true" data-gjs-custom-name="Main Container"><h1 style="font-family:'Inter', sans-serif; text-align: center; color: #111827;">Drag your first block here</h1></td></tr></table></td></tr></table>`);
      }
    });

    editor.on('component:selected', () => setActiveRightTab('styles'));
    editor.on('run:core:preview', () => setIsPreview(true));
    editor.on('stop:core:preview', () => setIsPreview(false));

    setEditorInstance(editor);
    return () => editor.destroy();
  }, [isGrapesLoaded]);

  useEffect(() => {
    if (activeLeftTab === "blogs" && blogs.length === 0) fetchBlogs();
  }, [activeLeftTab]);

  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await fetch("/api/content/blog");
      const data = await res.json();
      setBlogs(data.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const insertBlogToCanvas = (blog) => {
    if (!editorInstance) return;
    const blogHtml = `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; background-color: #ffffff; overflow: hidden;">
        <tr><td><img src="${blog.featuredImage}" style="width: 100%; display: block;" alt="${blog.title}" /></td></tr>
        <tr>
          <td style="padding: 24px;" data-gjs-droppable="true">
            <span style="display: inline-block; padding: 4px 10px; background-color: #f3f4f6; color: #4b5563; font-family:'Inter', sans-serif; font-size: 11px; font-weight: 600; border-radius: 4px; margin-bottom: 12px; text-transform: uppercase;"> Article</span>
            <h2 style="margin:0 0 12px 0;font-family:'Inter',sans-serif;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${blog.title}</h2>
            <p style="margin:0 0 20px 0;font-family:'Inter',sans-serif;font-size:15px;color:#4b5563;line-height:1.6;">${blog.content.blocks[0]?.data?.text?.substring(0, 480) || 'No content available'}...</p>
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 4px; background-color: #111827;" data-gjs-droppable="true">
                  <a href=${`https://kayapalat.in/blogs/${blog.slug}`} style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 10px 20px; display: inline-block;">Read Full Article</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
    editorInstance.addComponents(blogHtml);
  };

  const handleDeviceChange = (mode) => {
    setDeviceMode(mode);
    if (!editorInstance) return;
    editorInstance.setDevice(mode === "Mobile" ? 'mobile' : 'desktop');
  };

  const handleExport = () => {
    if (!editorInstance) return;
    const html = editorInstance.getHtml();
    const css = editorInstance.getCss();
    const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/[\s_]+/g, '-')}.html`;
    a.click();
  };

  const handleSaveToDatabase = async () => {
    if (!editorInstance) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const projectData = editorInstance.getProjectData();
      const html = editorInstance.getHtml();
      const css = editorInstance.getCss();
      const response = await fetch("/api/email/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName, projectData, compiledHtml: html, compiledCss: css }),
      });
      if (response.ok || response.status === 404) {
         setSaveSuccess(true);
         setTimeout(() => setSaveSuccess(false), 3000); 
      }
    } catch (error) {
      alert("Failed to save to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const undo = () => editorInstance && editorInstance.UndoManager.undo();
  const redo = () => editorInstance && editorInstance.UndoManager.redo();
  const togglePreview = () => {
    if (!editorInstance) return;
    if (isPreview) {
      editorInstance.stopCommand('core:preview');
    } else {
      editorInstance.runCommand('core:preview');
    }
  };
  const clearCanvas = () => {
    if (confirm("Are you sure you want to clear the canvas? This cannot be undone easily.")) {
      editorInstance?.DomComponents.clear();
      // Re-add root container
      editorInstance?.addComponents(`<table class="main-wrapper" width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td align="center"><table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding: 40px;" min-height="400px" data-gjs-droppable="true" data-gjs-custom-name="Main Container"><h1 style="font-family:'Inter', sans-serif; text-align: center; color: #111827;">Start fresh here</h1></td></tr></table></td></tr></table>`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 overflow-hidden font-sans text-sm">
      
      <style>{`
        /* Hide defaults */
        .gjs-logo-cont, .gjs-pn-panels { display: none !important; }
        
        /* Premium Block Styling */
        .gjs-block-category { border-bottom: 1px solid #e5e7eb; }
        .gjs-block-category .gjs-title { background-color: #f9fafb; color: #374151; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; letter-spacing: 0.5px; }
        .gjs-blocks-c { padding: 12px; background: #ffffff; }
        .gjs-block { padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; color: #4b5563; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02); transition: all 0.2s; display: flex; align-items: center; justify-content: center; min-height: 80px; width: calc(50% - 6px) !important; margin-bottom: 12px; float: left; margin-right: 12px; cursor: grab; }
        .gjs-block:nth-child(even) { margin-right: 0; }
        .gjs-block:hover { border-color: #3b82f6; color: #2563eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transform: translateY(-2px); z-index: 10; }
        
        /* Premium Drag & Drop Visual Indicators */
        .gjs-placeholder { background-color: #3b82f6 !important; position: absolute; z-index: 100; opacity: 1 !important; box-shadow: 0 0 4px rgba(59, 130, 246, 0.5); pointer-events: none;}
        .gjs-placeholder-int { background-color: #3b82f6 !important; box-shadow: 0 0 4px rgba(59, 130, 246, 0.5); }
        .gjs-placeholder::before { content: ""; position: absolute; width: 8px; height: 8px; background: #fff; border: 2px solid #3b82f6; border-radius: 50%; top: -3px; left: -4px; }
        
        /* Premium Canvas Element Selection Outlines */
        .gjs-hovered { outline: 2px dashed rgba(59, 130, 246, 0.5) !important; outline-offset: -2px; }
        .gjs-selected { outline: 2px solid #10b981 !important; outline-offset: -2px; }
        .gjs-toolbar { background-color: #10b981; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 4px; z-index: 101 !important; }
        .gjs-toolbar-item { color: white; border-radius: 4px; margin: 0 2px; }
        .gjs-toolbar-item:hover { background-color: #047857; color: white; }

        /* Style Manager Deep Customization */
        .gjs-sm-sector .gjs-sm-title, .gjs-clm-tags .gjs-sm-title, .gjs-trt-traits .gjs-sm-title { background-color: #f9fafb; color: #111827; border-bottom: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; font-weight: 600; font-size: 12px; padding: 12px 16px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: background 0.2s; }
        .gjs-sm-sector .gjs-sm-title:hover { background-color: #f3f4f6; }
        .gjs-sm-sector .gjs-sm-properties { background-color: white; padding: 16px 12px; }
        .gjs-sm-property { margin-bottom: 16px; padding: 0 4px; }
        .gjs-sm-property .gjs-sm-label { color: #4b5563; font-size: 12px; font-weight: 500; margin-bottom: 6px; display: flex; justify-content: space-between; }
        
        /* Sliders & Inputs */
        .gjs-field { background-color: #f9fafb; border: 1px solid #d1d5db; color: #111827; border-radius: 4px; transition: border 0.2s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); }
        .gjs-field:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
        .gjs-field input, .gjs-field select { color: #111827; font-size: 13px; padding: 6px 8px; }
        .gjs-field-color { background-color: transparent !important; border: none !important; box-shadow: none !important; }
        .gjs-field-color-picker { border: 1px solid #d1d5db; border-radius: 4px; width: 28px; height: 28px; }
        .gjs-field-slider { border: none !important; box-shadow: none !important; background: transparent !important; }
        .gjs-slider { appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #e5e7eb; outline: none; }
        .gjs-slider::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; transition: transform 0.1s; }
        .gjs-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        
        /* Layer Manager & Traits */
        .gjs-layer { border-bottom: 1px solid #f3f4f6; padding: 6px 0; color: #4b5563; }
        .gjs-layer.gjs-active { background-color: #eff6ff; color: #1d4ed8; font-weight: 500; }
        .gjs-layer-name { font-size: 13px; }
        .gjs-trt-trait { padding: 8px 12px; margin-bottom: 8px; }
        .gjs-trt-trait .gjs-label { color: #4b5563; font-size: 12px; font-weight: 500; margin-bottom: 4px; }
        
        /* Canvas */
        .gjs-cv-canvas { top: 0; width: 100%; height: 100%; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background-color: #e5e7eb; }
        .gjs-cv-canvas.gjs-cv-canvas__mobile { width: 375px; margin: 20px auto; border-radius: 36px; box-shadow: 0 0 0 12px #111827, 0 25px 50px -12px rgba(0, 0, 0, 0.5); height: calc(100% - 40px); overflow: hidden; }
      `}</style>

      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <div className="h-7 w-7 bg-[#05335c] rounded-md flex items-center justify-center">
              <LayoutTemplate size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden sm:block">Mail<span className="text-[#05335c]">Builder</span></h1>
          </div>
          
          <div className="flex items-center relative group">
            <input 
              type="text" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-sm font-semibold text-gray-700 bg-transparent border border-gray-200 hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded px-2 py-1 outline-none w-48 sm:w-64 transition-all"
              placeholder="Template Name"
            />
            <Pencil size={12} className="absolute right-2 text-gray-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>

          <div className="hidden md:flex items-center gap-1 pl-4 border-l border-gray-200">
            <button onClick={undo} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Undo">
              <Undo2 size={16} />
            </button>
            <button onClick={redo} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Redo">
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-md border border-gray-200">
          <button 
            onClick={() => handleDeviceChange("Desktop")}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${deviceMode === "Desktop" ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button 
            onClick={() => handleDeviceChange("Mobile")}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${deviceMode === "Mobile" ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePreview} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${isPreview ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'}`}>
             <Eye size={14} /> Preview
          </button>
          <button onClick={clearCanvas} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 hover:bg-red-50 rounded-md transition-colors">
             <Trash2 size={14} /> Clear
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-all shadow-sm">
             <Code size={14} /> Export HTML
          </button>
          <button 
            onClick={handleSaveToDatabase} 
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-md transition-all shadow-sm ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
             {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
             {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL */}
        <aside className={`w-[280px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 transition-transform ${isPreview ? '-translate-x-full hidden' : ''}`}>
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveLeftTab("blocks")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${activeLeftTab === "blocks" ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={14} /> Elements
            </button>
            <button 
              onClick={() => setActiveLeftTab("blogs")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${activeLeftTab === "blogs" ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Rss size={14} /> Dynamic Data
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
            <div className={`${activeLeftTab === "blocks" ? "block" : "hidden"}`} id="gjs-blocks"></div>
            
            <div className={`${activeLeftTab === "blogs" ? "block" : "hidden"} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">CMS Posts</h3>
                <button onClick={fetchBlogs} className="text-blue-600 hover:text-blue-700 p-1 bg-blue-50 rounded">
                  <Loader2 size={12} className={loadingBlogs ? "animate-spin" : ""} />
                </button>
              </div>
              {loadingBlogs ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Loader2 size={20} className="animate-spin mb-2 text-blue-600" />
                  <p className="text-xs">Fetching API...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {blogs.map((blog) => (
                    <div key={blog.id} className="bg-white border border-gray-200 rounded-md p-2 hover:border-blue-300 hover:shadow transition-all group cursor-grab">
                      <div className="relative h-24 w-full rounded overflow-hidden mb-2 bg-gray-100">
                        <img src={`${blog.featuredImage}`} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-[11px] leading-tight mb-1 line-clamp-2">{blog.title}</h4>
                      <h4 className="font-normal text-gray-600 text-[10px] leading-tight mb-1 line-clamp-2">{blog.metaDescription}</h4>
                      <button 
                        onClick={() => insertBlogToCanvas(blog)}
                        className="w-full py-1.5 mt-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white uppercase"
                      >
                        Inject to Canvas
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER PANEL */}
        <div className="flex-1 bg-[#e5e7eb] relative overflow-hidden flex items-center justify-center">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <div ref={editorRef} className="absolute inset-0"></div>
        </div>

        {/* RIGHT PANEL */}
        <aside className={`w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-10 transition-transform ${isPreview ? 'translate-x-full hidden' : ''}`}>
          <div className="flex border-b border-gray-200 bg-white shrink-0">
            <button 
              onClick={() => setActiveRightTab("styles")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeRightTab === "styles" ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Paintbrush size={16} /> Design
            </button>
            <button 
              onClick={() => setActiveRightTab("traits")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeRightTab === "traits" ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Settings size={16} /> Settings
            </button>
            <button 
              onClick={() => setActiveRightTab("layers")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeRightTab === "layers" ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <ListTree size={16} /> Layers
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className={`${activeRightTab === "styles" ? "block" : "hidden"}`}>
               <div id="gjs-styles" className="h-full pb-10"></div>
            </div>
            <div className={`${activeRightTab === "traits" ? "block" : "hidden"}`}>
               <div className="px-4 py-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Element Properties</div>
               <div id="gjs-traits" className="p-2 pb-10"></div>
            </div>
            <div className={`${activeRightTab === "layers" ? "block" : "hidden"}`}>
               <div className="px-4 py-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Document Tree</div>
               <div id="gjs-layers" className="pb-10"></div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}