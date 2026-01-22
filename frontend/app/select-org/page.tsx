"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, ArrowRight } from "lucide-react";

export default function SelectOrgPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch the list of Xero organizations connected to your user
    fetch("http://localhost:8000/api/tenants")
      .then((res) => res.json())
      .then((data) => {
        setTenants(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tenants:", err);
        setLoading(false);
      });
  }, []);

  const selectTenant = async (tenantId: string) => {
    setLoading(true);
    // 2. Tell the backend which organization to use
    await fetch("http://localhost:8000/api/set-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    
    // 3. Redirect to the Dashboard to see the data!
    router.push("/performance");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p>Loading your organizations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Building2 className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Select Organization</h1>
          <p className="text-gray-500 mt-2 text-sm">Choose which Xero company you want to analyze.</p>
        </div>

        <div className="space-y-3">
          {tenants.length > 0 ? (
            tenants.map((t: any) => (
              <button
                key={t.tenantId}
                onClick={() => selectTenant(t.tenantId)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 hover:shadow-md transition-all group bg-white text-left"
              >
                <span className="font-semibold text-gray-700 group-hover:text-blue-700">{t.tenantName}</span>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform" />
              </button>
            ))
          ) : (
             <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg text-sm">
                No organizations found. Please try connecting Xero again.
             </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
            <a href="http://localhost:8000/login" className="text-xs text-gray-400 hover:text-gray-600 underline">Reconnect Xero Account</a>
        </div>
      </div>
    </div>
  );
}