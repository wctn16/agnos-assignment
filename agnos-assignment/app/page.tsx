import Link from "next/link";
import { User, Stethoscope } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Patient Button */}
        <Link
          href="/patient-form"
          className="flex h-40 w-48 flex-col items-center justify-center rounded-2xl border bg-white text-lg font-semibold shadow hover:bg-blue-20 hover:text-blue-400 transition"
        >
          <User className="role-icon" />
          <span className="mt-2">Patient</span>
        </Link>

        {/* Staff Button */}
        <Link
          href="/staff-view"
          className="flex h-40 w-48 flex-col items-center justify-center rounded-2xl border bg-white text-lg font-semibold shadow hover:bg-green-20 hover:text-green-400 transition"
        >
          {/* <span className="text-5xl">🩺</span> */}
           <Stethoscope className="role-icon" />
          <span className="mt-2">Staff</span>
        </Link>
      </div>
    </div>
  );
}
