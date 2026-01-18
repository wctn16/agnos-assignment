'use client';
import PatientForm from "./PatientForm";
import "../globals.css";
import { useEffect, useState } from "react";
import { getAblyClient } from "@/src/lib/ably";
import Ably from "ably"
type AblyRealtimeClient = Ably.Realtime;


export default function PatientPage() {
  const [ably, setAbly] = useState<AblyRealtimeClient | null>(null);

  useEffect(() => {
    getAblyClient("patient").then(setAbly);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg border border-slate-300 shadow-xl">
        <h1 className="mb-6 text-start text-2xl font-semibold text-gray-800">
          Patient Information
        </h1>

        <PatientForm />
      </div>
    </div>
  );
}
