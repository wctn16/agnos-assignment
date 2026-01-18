"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Ably from "ably";

type PatientFormProps = {
  readOnly?: boolean;
  status?: string;
  data?: PatientFormData;
};
export type PatientFormData = {
  FirstName: string;
  MiddleName: string | null;
  LastName: string;
  BirthDate: string;
  Gender: string;
  PhoneNumber: string;
  Email: string | null;
  PreferredLanguage: string | null;
  Nationality: string;
  Religion: string | null;
  Address: string;
  ContactName: string | null;
  Relationship: string;
  ContactNumber: string;
};

export default function PatientForm({
  readOnly = false,
  data,
  status,
}: PatientFormProps) {
  const initialFormData: PatientFormData = {
    FirstName: "",
    MiddleName: null,
    LastName: "",
    BirthDate: "",
    Gender: "",
    PhoneNumber: "",
    Email: null,
    PreferredLanguage: null,
    Nationality: "",
    Religion: null,
    Address: "",
    ContactName: null,
    Relationship: "",
    ContactNumber: "",
  };

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const [patientStatus, setPatientStatus] = useState<
    "typing" | "idle" | "submitted" | "inactive"
  >("idle");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (readOnly) return;
    const ablyClient = new Ably.Realtime({
      authUrl: "/api/ably-token?role=patient",
    });

    ablyRef.current = ablyClient;

    return () => {
      // ablyClient.close();
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPatientStatus(status as "typing" | "idle" | "submitted" | "inactive");
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(data);
  }, [data, status]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (!ablyRef.current) {
      return;
    }

    const channel = ablyRef.current.channels.get("patient-form");
    channel.publish("field-change", {
      field: name,
      value,
    });
    // channel.publish("typing", { status: "typing" });
    channel.publish("typing", { status: "typing" });
    // setPatientStatus("typing");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      channel.publish("typing", { status: "idle" });
      setPatientStatus("idle");
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ablyRef.current) {
      return;
    }
    const channel = ablyRef.current.channels.get("patient-form");
    channel.publish("typing", { status: "submitted" });
    // setFormData(initialFormData); // clear form
  };
  const handleCancel = () => {
    if (ablyRef.current) {
      setFormData(initialFormData);
      const channel = ablyRef.current.channels.get("patient-form");
      channel.publish("field-change", {
        action: "clear",
      });
      channel.publish("typing", { status: "inactive" });
    }
    router.push("/", {});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 cols-3">
      <div className="lg:grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3 sm:row">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            name="FirstName"
            placeholder={readOnly ? "" : "Enter First Name"}
            className="form-input"
            readOnly={readOnly}
            value={formData.FirstName ?? ""}
            onChange={readOnly ? undefined : handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Middle Name (optional)
          </label>
          <input
            type="text"
            name="MiddleName"
            placeholder={readOnly ? "" : "Enter Middle Name"}
            className="form-input"
            readOnly={readOnly}
            value={formData.MiddleName ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            name="LastName"
            placeholder={readOnly ? "" : "Enter Last Name"}
            className="form-input"
            readOnly={readOnly}
            value={formData.LastName ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Date of Birth <span className="text-red-500">*</span>
          </label>

          <input
            required
            type="date"
            name="BirthDate"
            className="form-input"
            readOnly={readOnly}
            value={formData.BirthDate ?? ""}
            onChange={handleChange}
            max={today}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Gender <span className="text-red-500">*</span>
          </label>
          {readOnly ? (
            <input
              type="text"
              name="Gender"
              className="form-input"
              readOnly={readOnly}
              value={formData.Gender ?? ""}
            />
          ) : (
            <select
              required
              className="form-input"
              name="Gender"
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="tel"
            name="PhoneNumber"
            placeholder={readOnly ? "" : "Enter phone number"}
            className="form-input"
            pattern="^(0\d{8,9}|\+66\d{8,9})$"
            readOnly={readOnly}
            value={formData.PhoneNumber ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            name="Email"
            placeholder={readOnly ? "" : "Enter Email"}
            className="form-input"
            readOnly={readOnly}
            value={formData.Email ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Nationality <span className="text-red-500">*</span>
          </label>
          {readOnly ? (
            <input
              type="text"
              name="Nationality"
              className="form-input"
              readOnly={readOnly}
              value={formData.Nationality ?? ""}
            />
          ) : (
            <select
              required
              name="Nationality"
              className="form-input"
              onChange={handleChange}
            >
              <option value="">Select nationality</option>
              <option value="Thai">Thai</option>
              <option value="amerAmericanican">American</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Religion (optional)
          </label>
          {readOnly ? (
            <input
              type="text"
              name="Religion"
              className="form-input"
              readOnly={readOnly}
              value={formData.Religion ?? ""}
            />
          ) : (
            <select
              className="form-input"
              name="Religion"
              onChange={handleChange}
            >
              <option value="">Select religion</option>
              <option>Buddhism</option>
              <option>Christianity</option>
              <option>Islam</option>
              <option>Hinduism</option>
              <option>Other</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Preferred Language
          </label>
          {readOnly ? (
            <input
              type="text"
              name="PreferredLanguage"
              className="form-input"
              readOnly={readOnly}
              value={formData.PreferredLanguage ?? ""}
            />
          ) : (
            <select
              className="form-input"
              name="PreferredLanguage"
              disabled={readOnly}
              onChange={handleChange}
            >
              <option value="">Select language</option>
              <option value="Thai">Thai</option>
              <option value="English">English</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-600">
            Address
          </label>
          <textarea
            name="Address"
            placeholder={readOnly ? "" : "Enter address"}
            className="form-input"
            readOnly={readOnly}
            onChange={handleChange}
            value={formData.Address ?? ""}
          />
        </div>
        <div className="col-span-3">
          <label className="block text-md font-medium text-gray-600 font-semibold">
            Emergency Contact
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Contact name
          </label>
          <input
            type="text"
            name="ContactName"
            placeholder={readOnly ? "" : "Enter full name"}
            className="form-input"
            readOnly={readOnly}
            value={formData.ContactName ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Relationship
          </label>
          <input
            type="text"
            name="Relationship"
            placeholder={readOnly ? "" : "e.g. Parent, Spouse"}
            className="form-input"
            readOnly={readOnly}
            value={formData.Relationship ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Phone Number
          </label>
          <input
            type="tel"
            name="ContactNumber"
            placeholder={readOnly ? "" : "Enter contact number"}
            className="form-input"
            readOnly={readOnly}
            value={formData.ContactNumber ?? ""}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="my-2 border-t border-slate-200" />

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status */}
        {readOnly ? (
          <div className="flex items-center gap-2 text-sm">
            {patientStatus === "typing" && (
              <span className="text-blue-500">🟢 Patient is typing…</span>
            )}

            {patientStatus === "idle" && (
              <span className="text-gray-400">⏸ Patient is idle</span>
            )}

            {patientStatus === "submitted" && (
              <span className="font-semibold text-green-600">
                ✅ Form submitted
              </span>
            )}
            {patientStatus === "inactive" && (
              <span className="font-semibold text-red-500">
                🔴 Patient inactive
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm"></div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!readOnly && (
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium
                   text-white hover:bg-blue-600 transition"
            >
              Submit
            </button>
          )}

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm
                 font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </form>
  );
}
