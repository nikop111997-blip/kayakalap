
"use client";

import { useEffect, useState } from "react";
import {
  Facebook,
  Loader2,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileText,
} from "lucide-react";

const CRM_FIELDS = [
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp Number" },
  { key: "age", label: "Age" },
  { key: "schedule", label: "Transformation Schedule" },
  { key: "frustration", label: "Frustration" },
];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Suggest CRM fields based on Facebook question data.
function suggestField(question) {
  const key = (question.key || "").toLowerCase();
  const label = (question.label || "").toLowerCase();
  const type = (question.type || "").toUpperCase();

  if (
    type === "FULL_NAME" ||
    key.includes("full_name") ||
    label.includes("full name")
  ) return "name";

  if (
    type === "EMAIL" ||
    key.includes("email") ||
    label.includes("email")
  ) return "email";

  if (
    type === "PHONE" ||
    key.includes("phone") ||
    key.includes("mobile") ||
    label.includes("phone") ||
    label.includes("mobile")
  ) return "whatsapp";

  if (
    key.includes("age") ||
    label === "age" ||
    label.includes("your age")
  ) return "age";

  if (
    key.includes("schedule") ||
    key.includes("start") ||
    key.includes("transformation") ||
    label.includes("when do you want to start")
  ) return "schedule";

  if (
    key.includes("frustration") ||
    key.includes("problem") ||
    label.includes("frustration")
  ) return "frustration";

  return "";
}

function autoMapQuestions(questions) {
  const assigned = new Set();

  return questions.map((question) => {
    let suggested = suggestField(question);

    // Do not assign the same CRM field twice.
    if (assigned.has(suggested)) {
      suggested = "";
    }

    if (suggested) {
      assigned.add(suggested);
    }

    return {
      questionKey: question.key,
      questionLabel: question.label,
      questionType: question.type,
      crmField: suggested || null,
      options: question.options || [],
    };
  });
}

export default function FacebookLeadMapping() {
  const [pages, setPages] = useState([]);
  const [forms, setForms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [mappings, setMappings] = useState([]);

  const [pageId, setPageId] = useState("");
  const [formId, setFormId] = useState("");

  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load Facebook Pages.
  async function loadPages() {
    try {
      setLoadingPages(true);
      setError("");

      const result = await apiRequest(
        "/api/integrations/facebook/pages"
      );

      setPages(result.pages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  // Load forms whenever Page changes.
  useEffect(() => {
    if (!pageId) {
      setForms([]);
      setFormId("");
      setQuestions([]);
      setMappings([]);
      return;
    }

    let cancelled = false;

    async function loadForms() {
      try {
        setLoadingForms(true);
        setError("");
        setSuccess("");

        setForms([]);
        setFormId("");
        setQuestions([]);
        setMappings([]);

        const result = await apiRequest(
          `/api/integrations/facebook/forms?pageId=${encodeURIComponent(pageId)}`
        );

        if (!cancelled) {
          setForms(result.forms || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingForms(false);
      }
    }

    loadForms();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  // Load form questions and existing mapping.
  useEffect(() => {
    if (!pageId || !formId) {
      setQuestions([]);
      setMappings([]);
      return;
    }

    let cancelled = false;

    async function loadQuestions() {
      try {
        setLoadingQuestions(true);
        setError("");
        setSuccess("");

        const [fieldResult, mappingResult] = await Promise.all([
          apiRequest(
            `/api/integrations/facebook/forms/${encodeURIComponent(formId)}/fields?pageId=${encodeURIComponent(pageId)}`
          ),
          apiRequest(
            `/api/integrations/facebook/mappings?pageId=${encodeURIComponent(pageId)}&formId=${encodeURIComponent(formId)}`
          ),
        ]);

        if (cancelled) return;

        const fetchedQuestions = fieldResult.questions || [];

        setQuestions(fetchedQuestions);

        if (mappingResult.mapping) {
          const savedMappings = mappingResult.mapping.mappings || [];

          const mergedMappings = fetchedQuestions.map((question) => {
            const saved = savedMappings.find(
              (item) => item.questionKey === question.key
            );

            return {
              questionKey: question.key,
              questionLabel: question.label,
              questionType: question.type,
              crmField: saved?.crmField || null,
              options: question.options || [],
            };
          });

          setMappings(mergedMappings);
        } else {
          setMappings(autoMapQuestions(fetchedQuestions));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingQuestions(false);
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [pageId, formId]);

  // Update an individual question mapping.
  function updateMapping(questionKey, crmField) {
    setMappings((previous) =>
      previous.map((item) =>
        item.questionKey === questionKey
          ? { ...item, crmField: crmField || null }
          : item
      )
    );

    setError("");
    setSuccess("");
  }

  // Save mapping.
  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await apiRequest(
        "/api/integrations/facebook/mappings",
        {
          method: "POST",
          body: JSON.stringify({
            pageId,
            formId,
            mappings: mappings.map((item) => ({
              questionKey: item.questionKey,
              questionLabel: item.questionLabel,
              questionType: item.questionType,
              crmField: item.crmField || null,
            })),
          }),
        }
      );

      setSuccess(result.message || "Mappings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const mappedCount = mappings.filter(
    (item) => item.crmField
  ).length;

  const selectedPage = pages.find(
    (page) => page.id === pageId
  );

  const selectedForm = forms.find(
    (form) => form.id === formId
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Facebook className="text-blue-600" size={22} />
            <h2 className="text-xl font-semibold text-gray-900">
              Facebook Lead Mapping
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Connect Facebook form questions with your CRM lead fields.
          </p>
        </div>

        <button
          onClick={loadPages}
          disabled={loadingPages}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loadingPages ? "animate-spin" : ""}
          />
          Refresh Pages
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Page and Form selectors */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Page */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Facebook Page
          </label>

          <div className="relative">
            <select
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              disabled={loadingPages}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                {loadingPages ? "Loading Pages..." : "Select Facebook Page"}
              </option>

              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>

        {/* Form */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Instant Form
          </label>

          <div className="relative">
            <select
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              disabled={!pageId || loadingForms}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">
                {loadingForms
                  ? "Loading Forms..."
                  : "Select Instant Form"}
              </option>

              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.leads_count || 0} leads)
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Selected form summary */}
      {selectedPage && selectedForm && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-gray-50 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {selectedPage.name}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedForm.name}
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {questions.length}
              </p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>

            <div>
              <p className="text-lg font-semibold text-green-600">
                {mappedCount}
              </p>
              <p className="text-xs text-gray-500">Mapped</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingQuestions && (
        <div className="flex items-center justify-center gap-3 rounded-xl border bg-white py-16 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Fetching Facebook form questions...
        </div>
      )}

      {/* Empty state */}
      {!loadingQuestions && !formId && (
        <div className="rounded-xl border border-dashed bg-gray-50 px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 text-gray-400" size={32} />
          <h3 className="font-medium text-gray-800">
            Select a Facebook Form
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a Page and an Instant Form to configure its CRM mappings.
          </p>
        </div>
      )}

      {/* Questions and mapping */}
      {!loadingQuestions && formId && questions.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-white">

          <div className="border-b px-5 py-4">
            <h3 className="font-semibold text-gray-900">
              Question Mapping
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Choose the CRM field that should receive each Facebook answer.
            </p>
          </div>

          <div className="divide-y">
            {mappings.map((item, index) => (
              <div
                key={item.questionKey}
                className="grid grid-cols-1 items-center gap-4 px-5 py-5 md:grid-cols-[1fr_40px_1fr]"
              >

                {/* Facebook question */}
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>

                    <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Facebook Question
                    </span>
                  </div>

                  <p className="font-medium text-gray-900">
                    {item.questionLabel}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Type: {item.questionType}
                  </p>

                  {item.options?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.options.map((option) => (
                        <span
                          key={option.key}
                          className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                        >
                          {option.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="hidden justify-center md:flex">
                  <span className="text-gray-400">→</span>
                </div>

                {/* CRM field */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    CRM Lead Field
                  </label>

                  <select
                    value={item.crmField || ""}
                    onChange={(e) =>
                      updateMapping(
                        item.questionKey,
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Do not map this question</option>

                    {CRM_FIELDS.map((field) => (
                      <option
                        key={field.key}
                        value={field.key}
                        disabled={mappings.some(
                          (other) =>
                            other.questionKey !== item.questionKey &&
                            other.crmField === field.key
                        )}
                      >
                        {field.label}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-gray-500">
                    {item.crmField
                      ? `Saved to leads.${item.crmField}`
                      : "Unmapped answer will be stored under others during import."}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-gray-50 px-5 py-4">
            <div className="text-sm text-gray-600">
              {mappedCount} of {questions.length} questions mapped
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !questions.length}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        </div>
      )}

      {!loadingQuestions && formId && questions.length === 0 && (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-gray-500">
          No questions were returned for this form.
        </div>
      )}
    </div>
  );
}
