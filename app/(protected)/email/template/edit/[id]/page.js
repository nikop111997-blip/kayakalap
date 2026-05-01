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

export default function EditEmailBuilder() {
  // Grabbing ID from URL parameters
  const id = typeof window !== "undefined" ? window.location.pathname.split('/').pop() : "demo-id";

  const editorRef = useRef(null);
  const editorInitRef = useRef(false); // Prevents double-init in strict mode
  const [editorInstance, setEditorInstance] = useState(null);
  const [isGrapesLoaded, setIsGrapesLoaded] = useState(false);
  
  // Data Fetching State
  const [isFetching, setIsFetching] = useState(true);
  const [templateData, setTemplateData] = useState(null);

  // UI State
  const [activeLeftTab, setActiveLeftTab] = useState("blocks"); // 'blocks', 'blogs'
  const [activeRightTab, setActiveRightTab] = useState("styles"); // 'styles', 'traits', 'layers'
  const [deviceMode, setDeviceMode] = useState("Desktop");
  const [isPreview, setIsPreview] = useState(false);
  const [templateName, setTemplateName] = useState("Loading...");
  
  // Action State
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch Template Data
  useEffect(() => {
    if (!id) return;
    
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/email/template/${id}`);
        const result = await res.json();
        
        if (result.success) {
          setTemplateData(result.data);
          setTemplateName(result.data.name || "Untitled Template");
        } else {
          alert("Template not found or error loading data.");
          setTemplateName("New Template");
        }
      } catch (err) {
        console.error("Failed to fetch template", err);
        setTemplateName("New Template");
      } finally {
        setIsFetching(false);
      }
    };

    fetchTemplate();
  }, [id]);

  // 2. Load GrapesJS Dynamically
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

  // 3. Comprehensive GrapesJS Initialization
  useEffect(() => {
    // Wait until GrapesJS is loaded, DOM is ready, and data is fetched
    if (!isGrapesLoaded || !editorRef.current || isFetching || editorInitRef.current) return;
    editorInitRef.current = true;

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
            name: 'Spacing',
            open: false,
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
              { type: 'slider', property: 'letter-spacing', units: ['px', 'em'], min: -5, max: 20, step: 0.1 },
              { type: 'slider', property: 'line-height', units: ['px', 'em', '-'], min: 0, max: 5, step: 0.1 },
              { type: 'color', property: 'color' },
              { type: 'select', property: 'font-family', options: [
                { id: 'Arial, Helvetica, sans-serif', label: 'Arial' },
                { id: '"Arial Black", Gadget, sans-serif', label: 'Arial Black' },
                { id: '"Comic Sans MS", cursive, sans-serif', label: 'Comic Sans' },
                { id: '"Courier New", Courier, monospace', label: 'Courier New' },
                { id: 'Georgia, serif', label: 'Georgia' },
                { id: '"Inter", sans-serif', label: 'Inter' },
                { id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
                { id: '"Times New Roman", Times, serif', label: 'Times New Roman' },
                { id: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
                { id: 'Verdana, Geneva, sans-serif', label: 'Verdana' }
              ]}
            ]
          },
          {
            name: 'Background & Borders',
            open: false,
            buildProps: ['background-color', 'border-radius', 'border', 'box-shadow'],
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
              alert("Image upload failed: " + (data.error || "Unknown Error"));
            }
          } catch (error) {
            alert("Network error during image upload.");
          }
        }
      },
      
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          'body { font-family: "Inter", Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; }',
          '* { box-sizing: border-box; }',
          'img { max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none; display: block; }',
          'a { text-decoration: none; }',
          'table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }',
          '.email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }'
        ]
      },

      blockManager: {
        appendTo: "#gjs-blocks",
        blocks: [
          {
            id: "email-container",
            category: "Structure",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg><span class="text-xs">Main Wrapper</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;"><tr><td align="center"><table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><tr><td style="padding: 20px;" min-height="200px"></td></tr></table></td></tr></table>`,
          },
          {
            id: "section",
            category: "Structure",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="18" height="7" x="3" y="14" rx="1"/></svg><span class="text-xs">Row</span></div>`,
            content: `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="padding: 20px;"></td></tr></table>`,
          },
          {
            id: "2-columns",
            category: "Structure",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg><span class="text-xs">2 Columns</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" valign="top" style="padding: 10px;">
                    <img src="https://via.placeholder.com/300x200" style="width: 100%; border-radius: 4px; margin-bottom: 15px;"/>
                    <h3 style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 18px; color: #111827;">Column 1</h3>
                    <p style="margin: 0; font-family: sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Add content here.</p>
                  </td>
                  <td width="50%" valign="top" style="padding: 10px;">
                    <img src="https://via.placeholder.com/300x200" style="width: 100%; border-radius: 4px; margin-bottom: 15px;"/>
                    <h3 style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 18px; color: #111827;">Column 2</h3>
                    <p style="margin: 0; font-family: sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Add content here.</p>
                  </td>
                </tr>
              </table>
            `,
          },
          {
            id: "heading",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><strong class="text-xl">H1</strong><span class="text-xs">Heading</span></div>`,
            content: '<h1 style="font-family: \'Inter\', sans-serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 15px 0; line-height: 1.2;">Heading Text</h1>',
          },
          {
            id: "text",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg><span class="text-xs">Text</span></div>`,
            content: '<p style="font-family: \'Inter\', sans-serif; font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">Write your engaging email copy here. Select this text to edit it, or use the style panel to change its appearance.</p>',
          },
          {
            id: "image",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs">Image</span></div>`,
            content: { type: 'image', style: { width: '100%', 'max-width': '100%', 'height': 'auto', 'border-radius': '0px', 'display': 'block', 'margin': '0 auto 15px auto' }, activeOnRender: 1 },
          },
          {
            id: "button",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/></svg><span class="text-xs">Button</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 15px;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                    <a href="#" target="_blank" style="font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 14px 28px; border: 1px solid #2563eb; display: inline-block;">Call to Action</a>
                  </td>
                </tr>
              </table>
            `,
          },
          {
            id: "list",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg><span class="text-xs">List</span></div>`,
            content: `
              <ul style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">First item in the list</li>
                <li style="margin-bottom: 8px;">Second list item</li>
                <li style="margin-bottom: 8px;">Third list item</li>
              </ul>
            `,
          },
          {
            id: "table",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg><span class="text-xs">Table</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="12" style="border-collapse: collapse; margin-bottom: 15px; font-family: 'Inter', sans-serif; font-size: 14px; color: #374151;">
                <thead>
                  <tr>
                    <th align="left" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; font-weight: 600; color: #111827;">Product</th>
                    <th align="left" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; font-weight: 600; color: #111827;">Qty</th>
                    <th align="right" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; font-weight: 600; color: #111827;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border-bottom: 1px solid #f3f4f6;">Item 1</td>
                    <td style="border-bottom: 1px solid #f3f4f6;">1</td>
                    <td align="right" style="border-bottom: 1px solid #f3f4f6;">$10.00</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #f3f4f6;">Item 2</td>
                    <td style="border-bottom: 1px solid #f3f4f6;">2</td>
                    <td align="right" style="border-bottom: 1px solid #f3f4f6;">$20.00</td>
                  </tr>
                </tbody>
              </table>
            `,
          },
          {
            id: "divider",
            category: "Basic Elements",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg><span class="text-xs">Divider</span></div>`,
            content: '<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; width: 100%;" />',
          },
          {
            id: "hero",
            category: "Components",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/></svg><span class="text-xs">Hero Section</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111827; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
                <tr>
                  <td align="center" style="padding: 60px 20px;">
                    <h1 style="font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 800; color: #ffffff; margin: 0 0 20px 0;">Welcome to our Newsletter</h1>
                    <p style="font-family: 'Inter', sans-serif; font-size: 18px; color: #9ca3af; margin: 0 0 30px 0; max-width: 400px;">Stay up to date with the latest news, articles, and resources.</p>
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #3b82f6;">
                          <a href="#" style="font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 30px; display: inline-block;">Read the Latest</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `
          },
          {
            id: "article-card",
            category: "Components",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span class="text-xs">Article Card</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
                <tr>
                  <td width="200" valign="top">
                    <img src="https://via.placeholder.com/200x200" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Article Image" />
                  </td>
                  <td valign="top" style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-family: 'Inter', sans-serif; font-size: 18px; color: #111827;">Exciting News Update</h3>
                    <p style="margin: 0 0 15px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Catch up on the latest insights and updates from our team. We have been working hard to bring you new features.</p>
                    <a href="#" style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #2563eb; text-decoration: none;">Read More &rarr;</a>
                  </td>
                </tr>
              </table>
            `,
          },
          {
            id: "social-links",
            category: "Components",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg><span class="text-xs">Social Icons</span></div>`,
            content: `
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 20px auto;">
                <tr>
                  <td style="padding: 0 12px;"><a href="#"><img src="https://img.icons8.com/ios-filled/50/4b5563/facebook-new.png" width="24" height="24" alt="Facebook" style="display:block; border:0; outline:none; text-decoration:none;"/></a></td>
                  <td style="padding: 0 12px;"><a href="#"><img src="https://img.icons8.com/ios-filled/50/4b5563/twitterx--v2.png" width="24" height="24" alt="Twitter" style="display:block; border:0; outline:none; text-decoration:none;"/></a></td>
                  <td style="padding: 0 12px;"><a href="#"><img src="https://img.icons8.com/ios-filled/50/4b5563/instagram-new.png" width="24" height="24" alt="Instagram" style="display:block; border:0; outline:none; text-decoration:none;"/></a></td>
                  <td style="padding: 0 12px;"><a href="#"><img src="https://img.icons8.com/ios-filled/50/4b5563/linkedin.png" width="24" height="24" alt="LinkedIn" style="display:block; border:0; outline:none; text-decoration:none;"/></a></td>
                </tr>
              </table>
            `
          },
          {
            id: "footer",
            category: "Components",
            label: `<div class="flex flex-col items-center gap-1 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M3 17h18"/></svg><span class="text-xs">Footer</span></div>`,
            content: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center" style="padding: 20px; font-family: 'Inter', sans-serif; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 10px 0;">© 2026 Your Company Inc. All rights reserved.</p>
                    <p style="margin: 0;">123 Business Road, Tech City, TC 12345</p>
                    <p style="margin: 10px 0 0 0;"><a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a></p>
                  </td>
                </tr>
              </table>
            `
          }
        ],
      },
    });

    // 🌟 Load Existing Data OR Default Boilerplate
    editor.on('load', () => {
      editor.setDevice('desktop');
      
      if (templateData?.projectData) {
        editor.loadProjectData(templateData.projectData);
      } else if (!editor.getHtml()) {
        editor.addComponents(`<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;"><tr><td align="center"><table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><tr><td style="padding: 40px;" min-height="400px"><h1 style="font-family: sans-serif; text-align: center; color: #111827;">Start Building Here</h1></td></tr></table></td></tr></table>`);
      }
    });

    editor.on('component:selected', () => setActiveRightTab('styles'));
    editor.on('run:core:preview', () => setIsPreview(true));
    editor.on('stop:core:preview', () => setIsPreview(false));

    setEditorInstance(editor);

    return () => {
      editorInitRef.current = false;
      editor.destroy();
    };
  }, [isGrapesLoaded, isFetching, templateData]); // Depends on fetching completion

  // 4. Blog Data Fetching
  useEffect(() => {
    if (activeLeftTab === "blogs" && blogs.length === 0) fetchBlogs();
  }, [activeLeftTab]);

  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await fetch("/api/content/blog");
      const data = await res.json();
      setBlogs(data.data || []);
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
        <tr>
          <td><img src="https://picsum.photos/seed/${blog.id}/600/300" style="width: 100%; display: block;" alt="${blog.title}" /></td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <span style="display: inline-block; padding: 4px 10px; background-color: #f3f4f6; color: #4b5563; font-family: sans-serif; font-size: 11px; font-weight: 600; border-radius: 4px; margin-bottom: 12px; text-transform: uppercase;"> Article</span>
            <h2 style="margin: 0 0 12px 0; font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">${blog.title}</h2>
            <p style="margin: 0 0 20px 0; font-family: 'Inter', sans-serif; font-size: 15px; color: #4b5563; line-height: 1.6;">${blog.content?.blocks?.[0]?.data?.text?.substring(0, 120) || 'No content available'}...</p>
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 4px; background-color: #111827;">
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

  // 5. Editor Control Handlers
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

  // 🌟 MODIFIED FOR PUT API (EDIT MODE) 🌟
  const handleSaveToDatabase = async () => {
    if (!editorInstance || !id) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const projectData = editorInstance.getProjectData();
      const html = editorInstance.getHtml();
      const css = editorInstance.getCss();

      const response = await fetch(`/api/email/template/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: templateName,
          projectData, 
          compiledHtml: html, 
          compiledCss: css 
        }),
      });

      if (response.ok) {
         setSaveSuccess(true);
         setTimeout(() => setSaveSuccess(false), 3000); 
      } else {
         const data = await response.json();
         alert("Failed to save to database: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      alert("Network error. Failed to save to database.");
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
    }
  };

  // 🌟 Full page loading state to block jumping 🌟
  if (isFetching) {
    return (
      <div className="flex flex-col h-screen w-full bg-gray-100 items-center justify-center font-sans">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Template...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 overflow-hidden font-sans text-sm">
      <style>{`
        .gjs-logo-cont, .gjs-pn-panels { display: none !important; }
        .gjs-block-category { border-bottom: 1px solid #e5e7eb; }
        .gjs-block-category .gjs-title { background-color: #f9fafb; color: #374151; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; letter-spacing: 0.5px; }
        .gjs-blocks-c { padding: 12px; background: #ffffff; }
        .gjs-block { padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; color: #4b5563; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02); transition: all 0.2s; display: flex; align-items: center; justify-content: center; min-height: 80px; width: calc(50% - 6px) !important; margin-bottom: 12px; float: left; margin-right: 12px; }
        .gjs-block:nth-child(even) { margin-right: 0; }
        .gjs-block:hover { border-color: #3b82f6; color: #2563eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transform: translateY(-2px); z-index: 10; }
        .gjs-sm-sector .gjs-sm-title, .gjs-clm-tags .gjs-sm-title, .gjs-trt-traits .gjs-sm-title { background-color: #f9fafb; color: #111827; border-bottom: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; font-weight: 600; font-size: 12px; padding: 12px 16px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: background 0.2s; }
        .gjs-sm-sector .gjs-sm-title:hover { background-color: #f3f4f6; }
        .gjs-sm-sector .gjs-sm-properties { background-color: white; padding: 16px 12px; }
        .gjs-sm-property { margin-bottom: 16px; padding: 0 4px; }
        .gjs-sm-property .gjs-sm-label { color: #4b5563; font-size: 12px; font-weight: 500; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .gjs-field { background-color: #f9fafb; border: 1px solid #d1d5db; color: #111827; border-radius: 4px; transition: border 0.2s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); }
        .gjs-field:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
        .gjs-field input, .gjs-field select { color: #111827; font-size: 13px; padding: 6px 8px; }
        .gjs-field-color { background-color: transparent !important; border: none !important; box-shadow: none !important; }
        .gjs-field-color-picker { border: 1px solid #d1d5db; border-radius: 4px; width: 28px; height: 28px; }
        .gjs-field-slider { border: none !important; box-shadow: none !important; background: transparent !important; }
        .gjs-slider { appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #e5e7eb; outline: none; }
        .gjs-slider::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; transition: transform 0.1s; }
        .gjs-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .gjs-layer { border-bottom: 1px solid #f3f4f6; padding: 6px 0; color: #4b5563; }
        .gjs-layer.gjs-active { background-color: #eff6ff; color: #1d4ed8; font-weight: 500; }
        .gjs-layer-name { font-size: 13px; }
        .gjs-trt-trait { padding: 8px 12px; margin-bottom: 8px; }
        .gjs-trt-trait .gjs-label { color: #4b5563; font-size: 12px; font-weight: 500; margin-bottom: 4px; }
        .gjs-cv-canvas { top: 0; width: 100%; height: 100%; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background-color: #e5e7eb; }
        .gjs-cv-canvas.gjs-cv-canvas__mobile { width: 375px; margin: 20px auto; border-radius: 36px; box-shadow: 0 0 0 12px #111827, 0 25px 50px -12px rgba(0, 0, 0, 0.5); height: calc(100% - 40px); overflow: hidden; }
        .gjs-toolbar { background-color: #111827; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 4px; }
        .gjs-toolbar-item { color: white; border-radius: 4px; margin: 0 2px; }
        .gjs-toolbar-item:hover { background-color: #374151; color: white; }
      `}</style>

      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <div className="h-7 w-7 bg-[#05335c] rounded-md flex items-center justify-center">
              <LayoutTemplate size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden sm:block">Edit<span className="text-[#05335c]">Template</span></h1>
          </div>
          
          <div className="flex items-center relative group">
            <input 
              type="text" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-sm font-semibold  text-gray-700 bg-transparent border border-gray-200 hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded px-2 py-1 outline-none w-48 sm:w-64 transition-all"
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
             {isSaving ? 'Updating...' : saveSuccess ? 'Updated!' : 'Update'}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
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
                        <img src={`https://picsum.photos/seed/${blog.id}/300/150`} alt="Cover" className="w-full h-full object-cover" />
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

        <div className="flex-1 bg-[#e5e7eb] relative overflow-hidden flex items-center justify-center">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <div ref={editorRef} className="absolute inset-0"></div>
        </div>

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