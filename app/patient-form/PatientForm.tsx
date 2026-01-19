"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Ably from "ably";

type PatientFormProps = {
  isStaff?: boolean;
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

export default function PatientForm({ isStaff = false, data, status }: Readonly<PatientFormProps>) {
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
    if (isStaff) {
      // If switching to staff mode, ensure any existing client is closed.
      if (ablyRef.current) {
        try {
          ablyRef.current.close();
        } catch {
          // ignore close errors
        }
        ablyRef.current = null;
      }
      return;
    }

    const ablyClient = new Ably.Realtime({
      authUrl: "/api/ably-token?role=patient",
    });

    ablyRef.current = ablyClient;

    return () => {
      try {
        ablyClient.close();
      } catch {
        // ignore close errors
      }
      ablyRef.current = null;
    };
  }, [isStaff]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPatientStatus(status as "typing" | "idle" | "submitted" | "inactive");
    if (!data) return;
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
    channel.publish("typing", { status: "typing" });
    if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    channel.publish("typing", { status: "idle" });
    setPatientStatus("idle");
  }, 1000);
  };

  const requiredFields: (keyof PatientFormData)[] = [
    "FirstName",
    "LastName",
    "BirthDate",
    "Gender",
    "PhoneNumber",
    "Email",
    "Nationality",
  ];
  type FormErrors = Partial<Record<keyof PatientFormData, string>>;

  const [errors, setErrors] = useState<FormErrors>({});

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (!value.trim() && !isStaff) {
      setErrors((prev) => ({ ...prev, [name]: `This field is required` }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    requiredFields.forEach((field) => {
      const value = formData[field];

      if (value === null || value === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (!ablyRef.current) {
      return;
    }
    const channel = ablyRef.current.channels.get("patient-form");
    channel.publish("typing", { status: "submitted" });
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
  const inputBase =
    "w-full mt-1 px-4 py-2.5 text-sm rounded-xl border outline-none transition h-10";
  const getInputClass = (hasError?: boolean, disabled?: boolean) => {
    if (disabled) {
      return `${inputBase} bg-slate-50 text-slate-500 cursor-not-allowed`;
    }

    if (hasError) {
      return `${inputBase} border-red-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-300`;
    }

    return `${inputBase} border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 cols-3">
      <div className="lg:grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-3 sm:row-span">
        <div>
          <label htmlFor="FirstName" className="block text-sm font-medium text-gray-600 mt-3 sm:mt-3">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="FirstName"
            placeholder={isStaff ? "" : "Enter First Name"}
            readOnly={isStaff}
            value={formData.FirstName ?? ""}
            onChange={isStaff ? undefined : handleChange}
            onBlur={handleBlur}
            className={getInputClass(!!errors.FirstName, isStaff)}
          />
          {errors.FirstName && (
            <small className="text-red-500">{errors.FirstName}</small>
          )}
        </div>

        <div>
          <label htmlFor="MiddleName" className="block text-sm font-medium text-gray-600 mt-3 mt-3">
            Middle Name (optional)
          </label>
          <input
            type="text"
            name="MiddleName"
            placeholder={isStaff ? "" : "Enter Middle Name"}
            className={getInputClass(false, isStaff)}
            readOnly={isStaff}
            value={formData.MiddleName ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="LastName" className="block text-sm font-medium text-gray-600 mt-3 mt-3">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="LastName"
            placeholder={isStaff ? "" : "Enter Last Name"}
            readOnly={isStaff}
            value={formData.LastName ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClass(!!errors.LastName, isStaff)}
          />
          {errors.LastName && (
            <small className="text-red-500">{errors.LastName}</small>
          )}
        </div>

        <div>
          <label htmlFor="BirthDate" className="block text-sm font-medium text-gray-600 mt-3">
            Date of Birth <span className="text-red-500">*</span>
          </label>

          <input
            type="date"
            name="BirthDate"
            readOnly={isStaff}
            value={formData.BirthDate ?? ""}
            onChange={handleChange}
            max={today}
            onBlur={handleBlur}
            className={getInputClass(!!errors.BirthDate, isStaff)}
          />
          {errors.BirthDate && (
            <small className="text-red-500">{errors.BirthDate}</small>
          )}
        </div>

        <div>
          <label htmlFor="Gender" className="block text-sm font-medium text-gray-600 mt-3">
            Gender <span className="text-red-500">*</span>
          </label>
          {isStaff ? (
            <input
              type="text"
              name="Gender"
              readOnly={isStaff}
              value={formData.Gender ?? ""}
              className={getInputClass(false, isStaff)}
            />
          ) : (
            <select
              className={getInputClass(!!errors.Gender, isStaff)}
              name="Gender"
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          )}
          {errors.Gender && (
            <small className="text-red-500">{errors.Gender}</small>
          )}
        </div>

        <div>
          <label htmlFor="PhoneNumber" className="block text-sm font-medium text-gray-600 mt-3">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="PhoneNumber"
            placeholder={isStaff ? "" : "Enter phone number"}
            className={getInputClass(!!errors.PhoneNumber, isStaff)}
            pattern="^(0\d{8,9}|\+66\d{8,9})$"
            readOnly={isStaff}
            value={formData.PhoneNumber ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.PhoneNumber && (
            <small className="text-red-500">{errors.PhoneNumber}</small>
          )}
        </div>

        <div>
          <label htmlFor="Email" className="block text-sm font-medium text-gray-600 mt-3">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="Email"
            placeholder={isStaff ? "" : "Enter Email"}
            className={getInputClass(!!errors.Email, isStaff)}
            readOnly={isStaff}
            value={formData.Email ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.Email && (
            <small className="text-red-500">{errors.Email}</small>
          )}
        </div>

        <div>
          <label htmlFor="Nationality" className="block text-sm font-medium text-gray-600 mt-3">
            Nationality <span className="text-red-500">*</span>
          </label>
          {isStaff ? (
            <input
              type="text"
              name="Nationality"
              className={getInputClass(false, isStaff)}
              readOnly={isStaff}
              value={formData.Nationality ?? ""}
            />
          ) : (
            <select
              name="Nationality"
              className={getInputClass(!!errors.Nationality, isStaff)}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select nationality</option>
              <option value="Thai">Thai</option>
              <option value="amerAmericanican">American</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Other">Other</option>
            </select>
          )}
          {errors.Nationality && (
            <small className="text-red-500">{errors.Nationality}</small>
          )}
        </div>

        <div>
          <label htmlFor="Religion" className="block text-sm font-medium text-gray-600 mt-3">
            Religion (optional)
          </label>
          {isStaff ? (
            <input
              type="text"
              name="Religion"
              className={getInputClass(false, isStaff)}
              readOnly={isStaff}
              value={formData.Religion ?? ""}
            />
          ) : (
            <select
              className={getInputClass(false, isStaff)}
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
          <label htmlFor="PreferredLanguage" className="block text-sm font-medium text-gray-600 mt-3">
            Preferred Language
          </label>
          {isStaff ? (
            <input
              type="text"
              name="PreferredLanguage"
              className={getInputClass(false, isStaff)}
              readOnly={isStaff}
              value={formData.PreferredLanguage ?? ""}
            />
          ) : (
            <select
              className={getInputClass(false, isStaff)}
              name="PreferredLanguage"
              disabled={isStaff}
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
          <label htmlFor="Address" className="block text-sm font-medium text-gray-600 mt-3">
            Address
          </label>
          <textarea
            rows={4}
            name="Address"
            placeholder={isStaff ? "" : "Enter address"}
            className={getInputClass(false, isStaff)}
            readOnly={isStaff}
            onChange={handleChange}
            value={formData.Address ?? ""}
          />
        </div>
        <div className="col-span-3">
          <label htmlFor="ContactName" className="block text-md font-medium text-gray-600 font-semibold mt-3">
            Emergency Contact
          </label>
        </div>
        <div>
          <label htmlFor="ContactName" className="block text-sm font-medium text-gray-600 mt-3">
            Contact name
          </label>
          <input
            id="ContactName"
            type="text"
            name="ContactName"
            placeholder={isStaff ? "" : "Enter full name"}
            className={getInputClass(false, isStaff)}
            readOnly={isStaff}
            value={formData.ContactName ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="Relationship" className="block text-sm font-medium text-gray-600 mt-3">
            Relationship
          </label>
          <input
            type="text"
            name="Relationship"
            placeholder={isStaff ? "" : "e.g. Parent, Spouse"}
            className={getInputClass(false, isStaff)}
            readOnly={isStaff}
            value={formData.Relationship ?? ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="ContactNumber" className="block text-sm font-medium text-gray-600 mt-3">
            Phone Number
          </label>
          <input
            type="tel"
            name="ContactNumber"
            placeholder={isStaff ? "" : "Enter contact number"}
            className={getInputClass(false, isStaff)}
            readOnly={isStaff}
            value={formData.ContactNumber ?? ""}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="my-2 border-t border-slate-200" />

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status */}
        {isStaff ? (
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
          {!isStaff && (
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
