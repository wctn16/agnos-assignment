"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Ably from "ably";
type AblyRealtimeClient = Ably.Realtime;

type PatientFormProps = {
  readOnly?: boolean;
  enableRealtime?: boolean;
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

  const [ably, setAbly] = useState<AblyRealtimeClient | null>(null);
  useEffect(() => {
    if (readOnly) return;
    console.log("INIT ABLY");

    const ablyClient = new Ably.Realtime({
      authUrl: "/api/ably-token?role=patient",
    });

    ablyClient.connection.on("connected", () => {
      console.log("ABLY CONNECTED");
    });

    ablyRef.current = ablyClient;

    return () => {
      ablyClient.close();
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(data);
    console.log(data);
    
  }, [data]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (!ablyRef.current) {
      console.log("ABLY STILL NULL");
      return;
    }

    console.log("PUBLISH:", name, value);

    const channel = ablyRef.current.channels.get("patient-form");
    channel.publish("field-change", {
      field: name,
      value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Patient Data:", formData);

    setFormData(initialFormData); // clear form
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
            <div className="form-input bg-slate-50 text-slate-500">
              {formData.Gender || "Not provided"}
            </div>
          ) : (
            <select
              required
              className="form-input"
              name="Gender"
              disabled={readOnly}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
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
            Preferred Language
          </label>
          {readOnly ? (
            <div className="form-input bg-slate-50 text-slate-500">
              {formData.PreferredLanguage || "Not provided"}
            </div>
          ) : (
            <select
              className="form-input"
              name="PreferredLanguage"
              disabled={readOnly}
            >
              <option value="">Select language</option>
              <option value="th">Thai</option>
              <option value="en">English</option>
              <option value="other">Other</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Nationality <span className="text-red-500">*</span>
          </label>
          {readOnly ? (
            <div className="form-input bg-slate-50 text-slate-500">
              {formData.Nationality || "Not provided"}
            </div>
          ) : (
            <select
              required
              name="Nationality"
              className="form-input"
              disabled={readOnly}
            >
              <option value="">Select nationality</option>
              <option value="thai">Thai</option>
              <option value="american">American</option>
              <option value="chinese">Chinese</option>
              <option value="japanese">Japanese</option>
              <option value="other">Other</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Religion (optional)
          </label>
          {readOnly ? (
            <div className="form-input bg-slate-50 text-slate-500">
              {formData.Religion || "Not provided"}
            </div>
          ) : (
            <select className="form-input" name="Religion">
              <option value="">Select religion</option>
              <option>Buddhism</option>
              <option>Christianity</option>
              <option>Islam</option>
              <option>Hinduism</option>
              <option>Other</option>
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
            // value={formData.Address ?? ""}
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

      <div className="flex justify-end gap-3 pt-2">
        {/* Submit */}
        <button
          hidden={readOnly}
          type="submit"
          className="rounded-lg bg-blue-500
               px-4 py-2 text-sm font-medium
               text-white hover:bg-blue-600 transition"
        >
          Submit
        </button>
        {/* Close */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border border-slate-300
               px-4 py-2 text-sm font-medium
               text-slate-600 hover:bg-slate-100 transition"
        >
          Close
        </button>
      </div>
    </form>
  );
}
