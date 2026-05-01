"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Eye, 
  MousePointerClick, 
  Loader2, 
  CheckCircle2, 
  TestTube2,
  Users,
  LayoutTemplate
} from "lucide-react";

function CampaignForm() {
  const [urlTemplateId, setUrlTemplateId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUrlTemplateId(params.get("templateId"));
    }
  }, []);

  // Data States
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // Form States
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    templateId: "",
    audience: "all", // New audience selection state
    trackOpens: true,
    trackClicks: true,
  });

  // Action States
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Replace with your actual endpoint to fetch all templates
        const response = await fetch("/api/email/template"); 
        if (response.ok) {
          const result = await response.json();
          // Assuming result.data is an array of templates
          const fetchedTemplates = result.data || [];
          setTemplates(fetchedTemplates);

          // If there's a templateId in the URL and it exists in the fetched list, ensure it's selected
          if (urlTemplateId && fetchedTemplates.some(t => t._id === urlTemplateId)) {
            setFormData(prev => ({ ...prev, templateId: urlTemplateId }));
          } else if (fetchedTemplates.length > 0 && !formData.templateId) {
             // Fallback to first template if none selected
             setFormData(prev => ({ ...prev, templateId: fetchedTemplates[0]._id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [urlTemplateId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSendTest = async (e) => {
  e.preventDefault();

  if (!testEmail || !formData.templateId) {
    alert("Enter email and select template");
    return;
  }

  setIsSendingTest(true);

  try {
    const res = await fetch("/api/email/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        templateId: formData.templateId,
        subject: formData.subject,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    setSuccessMessage(`Email sent to ${testEmail}`);
    setTimeout(() => setSuccessMessage(""), 4000);

  } catch (err) {
    console.error(err);
    alert("Failed to send email");
  } finally {
    setIsSendingTest(false);
  }
};

 const handleSendCampaign = async (e) => {
  e.preventDefault();

  if (!formData.title || !formData.subject || !formData.templateId) {
    alert("Fill all fields");
    return;
  }

  setIsSendingCampaign(true);

  try {
    await fetch("/api/email/campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setSuccessMessage("Campaign started 🚀");

  } catch (err) {
    alert("Failed");
  } finally {
    setIsSendingCampaign(false);
  }
};

  // Find the selected template to display its preview
  const selectedTemplate = templates.find(t => t._id === formData.templateId);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Send className="text-blue-600" /> New Email Campaign
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure and send an email to your customer list.</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-gray-400" /> Campaign Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title (Internal)</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Spring Sale Announcement"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Huge savings inside! 🌷"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                {isLoadingTemplates ? (
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading templates...
                  </div>
                ) : (
                  <select
                    name="templateId"
                    value={formData.templateId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="" disabled>Select a saved template</option>
                    {templates.map((tpl) => (
                      <option key={tpl._id} value={tpl._id}>
                        {tpl.name || "Untitled Template"}
                      </option>
                    ))}
                  </select>
                )}
                {urlTemplateId && !isLoadingTemplates && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <LayoutTemplate size={12} /> Template auto-selected from builder
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Subscribers</option>
                  <option value="last_7_days">New Subscribers (Last 7 Days)</option>
                  <option value="last_30_days">New Subscribers (Last 30 Days)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Tracking & Analytics</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="trackOpens"
                  checked={formData.trackOpens}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Eye size={14} className="text-gray-500"/> Track Opens</div>
                  <div className="text-xs text-gray-500">Know when recipients open your email</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="trackClicks"
                  checked={formData.trackClicks}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><MousePointerClick size={14} className="text-gray-500"/> Track Clicks</div>
                  <div className="text-xs text-gray-500">See which links are being clicked</div>
                </div>
              </label>
            </div>
          </div>

          {/* Template Preview Section */}
          {selectedTemplate && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-gray-400" /> Template Preview
              </h2>
              <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 flex justify-center items-center">
                <div className="w-full max-w-[600px] bg-white shadow-sm border border-gray-200 overflow-hidden rounded-md relative">
                  {/* Decorative "Browser" header for the preview frame */}
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium ml-2 uppercase">
                      Desktop View • 600px
                    </div>
                  </div>
                  
                  {/* Iframe isolates the email CSS from the application CSS */}
                  <iframe
                    srcDoc={selectedTemplate.compiledHtml || "<div style='padding:40px; text-align:center; font-family:sans-serif; color:#666;'>No HTML preview available.</div>"}
                    title="Template Preview"
                    className="w-full h-[500px] bg-white border-none"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TestTube2 size={18} className="text-gray-400" /> Send Test Mail
            </h2>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="test@yourdomain.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingTest ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {isSendingTest ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <h2 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Users size={18} /> Launch Campaign
            </h2>
            <p className="text-xs text-blue-700 mb-6">
              This will send the selected template to {formData.audience === 'all' ? 'your entire customer mailing list' : formData.audience === 'last_7_days' ? 'subscribers from the last 7 days' : 'subscribers from the last 30 days'}. Ensure you have tested it first.
            </p>
            <button
              onClick={handleSendCampaign}
              disabled={isSendingCampaign || isLoadingTemplates}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSendingCampaign ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSendingCampaign ? "Processing..." : "Launch Campaign"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SendCampaignPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CampaignForm />
    </div>
  );
}