import PatientForm from "../patient-form/PatientForm";
import "../globals.css";
export default function StaffPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg border border-slate-300 shadow-xl">
        <h1 className="mb-6 text-start text-2xl font-semibold text-gray-800">
          Staff View
        </h1>

        <PatientForm readOnly/>
      </div>
    </div>
  );
}
