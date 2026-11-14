
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Loader2,
  Save,
  Settings2,
  AlertCircle,
  Link2,
} from "lucide-react";

const PAGE_ID = "249659368570089";
const PAGE_NAME = "Kayapalat Wellness";

const CRM_FIELDS = [
  { value: "fullName", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "city", label: "City" },
  { value: "goal", label: "Goal" },
  { value: "currentWeight", label: "Current Weight" },
];

const DEFAULT_STATUS = "new";

function suggestField(question) {
  const key = `${question.key || ""} ${
    question.label || ""
  } ${question.type || ""}`.toLowerCase();

  if (
    question.type === "FULL_NAME" ||
    key.includes("full name") ||
    key.includes("name")
  ) {
    return "fullName";
  }

  if (question.type === "EMAIL" || key.includes("email")) {
    return "email";
  }

  if (
    question.type === "PHONE" ||
    key.includes("phone") ||
    key.includes("mobile") ||
    key.includes("contact number")
  ) {
    return "phone";
  }

  if (key.includes("city") || key.includes("location")) {
    return "city";
  }

  if (
    key.includes("goal") ||
    key.includes("weight loss") ||
    key.includes("objective")
  ) {
    return "goal";
  }

  if (
    key.includes("current weight") ||
    key.includes("weight")
  ) {
    return "currentWeight";
  }

  return "";
}

export default function FacebookFormMappingPage() {
  const params = useParams();
  const router = useRouter();

  const formId = params.formId;

  const [pageId, setPageId] = useState(PAGE_ID);
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [defaultLeadStatus, setDefaultLeadStatus] =
    useState(DEFAULT_STATUS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const queryPageId =
      new URLSearchParams(window.location.search).get("pageId");

    if (queryPageId) {
      setPageId(queryPageId);
    }
  }, []);

  useEffect(() => {
    if (!formId || !pageId) return;

    loadFormData();
  }, [formId, pageId]);

  async function loadFormData() {
    try {
      setLoading(true);
      setError("");

      const [fieldsResponse, mappingResponse] = await Promise.all([
        fetch(
          `/api/integrations/facebook/forms/${encodeURIComponent(
            formId
          )}/fields?pageId=${encodeURIComponent(pageId)}`
        ),
        fetch(
          `/api/integrations/facebook/mappings?pageId=${encodeURIComponent(
            pageId
          )}&formId=${encodeURIComponent(formId)}`
        ),
      ]);

      const fieldsData = await fieldsResponse.json();
      const mappingData = await mappingResponse.json();

      if (!fieldsResponse.ok || !fieldsData.success) {
        throw new Error(
          fieldsData.message || "Unable to load Facebook form questions"
        );
      }

      if (!mappingResponse.ok || !mappingData.success) {
        throw new Error(
          mappingData.message || "Unable to load saved mappings"
        );
      }

      const fetchedQuestions = fieldsData.questions || [];

      setForm(fieldsData.form);
      setQuestions(fetchedQuestions);

      const savedMapping = mappingData.mapping;

      const initialMappings = {};

      fetchedQuestions.forEach((question) => {
        const existing = savedMapping?.mappings?.find(
          (item) => item.questionKey === question.key
        );

        initialMappings[question.key] =
          existing?.crmField || suggestField(question);
      });

      setFieldMappings(initialMappings);
      setDefaultLeadStatus(
        savedMapping?.defaultLeadStatus || DEFAULT_STATUS
      );
    } catch (err) {
      console.error("Mapping page error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const mappedCount = useMemo(
    () =>
      Object.values(fieldMappings).filter(Boolean).length,
    [fieldMappings]
  );

  const usedFields = useMemo(
    () =>
      Object.entries(fieldMappings)
        .filter(([, value]) => value)
        .map(([, value]) => value),
    [fieldMappings]
  );

  function updateMapping(questionKey, crmField) {
    setFieldMappings((previous) => ({
      ...previous,
      [questionKey]: crmField,
    }));

    setSuccess("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const mappings = questions.map((question) => ({
        questionKey: question.key,
        questionLabel: question.label,
        questionType: question.type,
        crmField: fieldMappings[question.key] || null,
      }));

      const response = await fetch(
        "/api/integrations/facebook/mappings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageId,
            formId,
            mappings,
            defaultLeadStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save mapping");
      }

      setSuccess("Form mapping saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading form questions...
          </p>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto bg-white border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-600 mb-3">
            <AlertCircle size={20} />
            <h2 className="font-semibold">Unable to load mapping</h2>
          </div>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={loadFormData}
            className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <button
              onClick={() => router.push("/integration/facebook/forms")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4"
            >
              <ArrowLeft size={16} />
              Back to Forms
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Settings2 size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Form Field Mapping
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Connect Facebook form questions with your CRM fields.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Mapping"}
          </button>
        </div>

        {/* Form information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Connected Facebook Page
              </p>
              <h2 className="font-semibold text-slate-900">
                {PAGE_NAME}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Page ID: {pageId}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Selected Lead Form
              </p>
              <h2 className="font-semibold text-slate-900">
                {form?.name || "Facebook Lead Form"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Form ID: {formId}
              </p>
            </div>
          </div>
        </div>

        {/* Mapping progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Total Questions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {questions.length}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Mapped Questions</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {mappedCount}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Unmapped Questions</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {questions.length - mappedCount}
            </p>
          </div>
        </div>

        {/* Default status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                Default Lead Status
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Every lead imported from this form will receive this status
                unless you change it later.
              </p>

              <div className="relative mt-4 max-w-sm">
                <select
                  value={defaultLeadStatus}
                  onChange={(e) => setDefaultLeadStatus(e.target.value)}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white outline-none focus:border-blue-500"
                >
                  <option value="new">New</option>
                </select>

                <ChevronDown
                  size={17}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions mapping */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Map Form Questions
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Select the CRM field where each Facebook answer should be saved.
                </p>
              </div>

              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                {mappedCount}/{questions.length} mapped
              </span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="font-medium text-slate-700">
                No questions found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                This form does not currently have any available questions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((question, index) => {
                const selectedField =
                  fieldMappings[question.key] || "";

                return (
                  <div
                    key={question.key}
                    className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center"
                  >
                    {/* Facebook question */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-400">
                          QUESTION {index + 1}
                        </span>

                        <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {question.type || "CUSTOM"}
                        </span>
                      </div>

                      <h4 className="font-medium text-slate-900">
                        {question.label || question.key}
                      </h4>

                      <p className="text-xs text-slate-400 mt-1 break-all">
                        Key: {question.key}
                      </p>

                      {question.options?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {question.options.map((option) => (
                            <span
                              key={option.key}
                              className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md"
                            >
                              {option.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CRM field */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-2 block">
                        SAVE ANSWER IN CRM FIELD
                      </label>

                      <div className="relative">
                        <select
                          value={selectedField}
                          onChange={(e) =>
                            updateMapping(question.key, e.target.value)
                          }
                          className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white outline-none focus:border-blue-500"
                        >
                          <option value="">
                            Do not map — save in Others
                          </option>

                          {CRM_FIELDS.map((field) => {
                            const alreadyUsed =
                              usedFields.includes(field.value) &&
                              selectedField !== field.value;

                            return (
                              <option
                                key={field.value}
                                value={field.value}
                                disabled={alreadyUsed}
                              >
                                {field.label}
                                {alreadyUsed ? " (Already mapped)" : ""}
                              </option>
                            );
                          })}
                        </select>

                        <ChevronDown
                          size={17}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>

                      <p className="text-xs text-slate-400 mt-2">
                        {selectedField
                          ? `Mapped to ${
                              CRM_FIELDS.find(
                                (field) => field.value === selectedField
                              )?.label
                            }`
                          : "This answer will be stored in the Others object during import."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
          <CircleHelp
            size={19}
            className="text-blue-600 shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              How unmapped questions work
            </p>
            <p className="text-sm text-blue-800 mt-1">
              Any question left as &quot;Do not map&quot; will be retained
              under the <strong>others</strong> object when the lead is
              imported. No answer needs to be discarded.
            </p>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* Bottom save */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
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
    </div>
  );
}
