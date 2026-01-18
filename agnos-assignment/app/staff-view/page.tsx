"use client";
import PatientForm, { PatientFormData } from "../patient-form/PatientForm";
import "../globals.css";
import { useState, useEffect, useRef } from "react";
import Ably from "ably"

export default function StaffPage() {
     const ablyRef = useRef<Ably.Realtime | null>(null);

  const [patientData, setPatientData] = useState<PatientFormData>({
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
  });

  useEffect(() => {
    const ably = new Ably.Realtime({
      authUrl: "/api/ably-token?role=staff",
    });

    ablyRef.current = ably;

    const channel = ably.channels.get("patient-form");

    channel.subscribe("field-change", (msg) => {
      const { field, value } = msg.data;

      console.log("STAFF RECEIVED:", field, value);

      setPatientData((prev) => ({
        ...prev,
        [field]: value,
      }));
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg border border-slate-300 shadow-xl">
        <h1 className="mb-6 text-start text-2xl font-semibold text-gray-800">
          Staff View
        </h1>

        <PatientForm readOnly  data={patientData} />
      </div>
    </div>
  );
}
