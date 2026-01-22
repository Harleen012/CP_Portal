// "use client";

// import React, { useState } from 'react';
// import { useRouter } from "next/navigation";

// import { 
//   FileText, 
//   Upload, 
//   CheckCircle, 
//   XCircle, 
//   Loader2, 
//   User, 
//   DollarSign, 
//   Briefcase,
//   FileCheck,
//   MapPin,
//   Calendar,
//   CreditCard,
//   Hash,
//   ArrowRight,
//   Info
// } from 'lucide-react';

// export default function LoanApplicationPage() {
//     const router = useRouter();
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     loanAmount: '',
//     loanType: '',
//     loanPurpose: '',
//     annualIncome: '',
//     PreferredLoanTerm: '',
//     BankAccountDetails: '',
//     employmentStatus: '',
//     ExistingDebts: '',
//     DebttoIncomeRatio: '',
//     creditScore: '',
//     loanRequestStatus: 'Pending'
//   });

//   const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [status, setStatus] = useState<'idle' | 'processing' | 'approved' | 'rejected'>('idle');

//   const requiredDocuments = [
//     "Property Details",
//     "GST Filings",
//     "Personal Tax Returns",
//     "Loan Application Form",
//     "Driver License",
//     "Passport",
//     "Proof of Employment"
//   ];

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setUploadedFiles({ ...uploadedFiles, [docName]: e.target.files[0] });
//     }
//   };

//   const submitToAgent = async () => {
//     setIsSubmitting(true);
//     setStatus('processing');

//     // Simulating the Agent Run
//     setTimeout(() => {
//       setIsSubmitting(false);
//       const isApproved = parseInt(formData.creditScore) > 700 || parseInt(formData.annualIncome) > 50000; 
//       setStatus(isApproved ? 'approved' : 'rejected');
//       setFormData(prev => ({ ...prev, loanRequestStatus: isApproved ? 'Approved' : 'Rejected' }));
//     }, 4000);
//   };

//   return (
//     <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-indigo-100">
//       <div className="max-w-[1400px] mx-auto p-6 md:p-10">
        
//         {/* Modern Header */}
//         <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
//           <div className="flex flex-col md:flex-row md:items-center gap-4">
//             {/* 🔙 Back Button */}
//             <button
//             onClick={() => router.push("/dashboard")}
//             className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition-all shadow-sm"
//     >
//       ← Back
//     </button>
//             <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Loan Application</h1>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
//           {/* Main Content Area */}
//           <div className="xl:col-span-8 space-y-8">
            
//             {/* Form Section */}
//             <section className="bg-white rounded-[32px] shadow-xl shadow-slate-200/60 border border-white overflow-hidden">
//               <div className="p-8 md:p-10">
//                 <div className="flex items-center gap-3 mb-8">
//                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
//                     <FileText size={24} />
//                   </div>
//                   <div>
//                     <h2 className="text-2xl font-bold text-slate-800">Primary Information</h2>
//                     <p className="text-sm text-slate-400 font-medium">Please ensure all data matches your legal documents.</p>
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
//                   <InputField label="Full Name" name="fullName" placeholder="John Doe" onChange={handleInputChange} icon={<User size={18}/>} />
//                   <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" onChange={handleInputChange} />
//                   <InputField label="Annual Income" name="annualIncome" type="number" placeholder="85000" onChange={handleInputChange} icon={<DollarSign size={18}/>} />
//                   <InputField label="Requested Amount" name="loanAmount" type="number" placeholder="50000" onChange={handleInputChange} icon={<DollarSign size={18}/>} />
//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide flex items-center gap-2">
//                      Preferred Loan Term <Info size={14} className="text-slate-300" />
//                     </label>
//                     <select 
//                       name="PreferredLoanTerm"
//                       onChange={handleInputChange}
//                       className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
//                     >
//                       <option value="">Choose Category</option>
//                       <option value="Personal">1 Year</option>
//                       <option value="Home">2 Year</option>
//                       <option value="Business">3 Year</option>
//                       <option value="Others">5 Year</option>
//                     </select>
//                   </div>
//                    <InputField label="Bank Account Details" name="bankAccountDetails" type="text" placeholder="Account Number" onChange={handleInputChange} />
//                     <InputField label="Monthly Obligations" name="existingDebts" type="number" placeholder="1200" onChange={handleInputChange} icon={<DollarSign size={18}/>} />

//                   <InputField label="Credit Score" name="creditScore" type="number" placeholder="720" onChange={handleInputChange} />
                  
//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide">Employment</label>
//                     <select 
//                       name="employmentStatus"
//                       onChange={handleInputChange}
//                       className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
//                     >
//                       <option value="">Choose Status</option>
//                       <option value="Employed">Employed</option>
//                       <option value="Retired">Retired</option>
//                       <option value="Self-Employed">Self-Employed</option>
//                       <option value="Non-Employed">Non-Employed</option>
//                     </select>
//                   </div>
                 
//                 </div>
//                 {/* Submit Button */}
// <div className="mt-10 flex justify-center">
//   <button
//     onClick={submitToAgent}
//     disabled={isSubmitting}
//     className={`px-10 py-4 rounded-2xl font-extrabold text-sm uppercase tracking-widest transition-all shadow-lg
//       ${
//         isSubmitting
//           ? "bg-slate-300 text-slate-600 cursor-not-allowed"
//           : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 active:scale-95"
//       }`}
//   >
//     {isSubmitting ? (
//       <span className="flex items-center gap-2">
//         <Loader2 className="w-4 h-4 animate-spin" />
//         Submitting...
//       </span>
//     ) : (
//       "Submit Loan Application"
//     )}
//   </button>
// </div>

//               </div>
//             </section>

//             {/* Document Section */}
//             <section className="bg-white rounded-[32px] shadow-xl shadow-slate-200/60 border border-white overflow-hidden">
//               <div className="p-8 md:p-10">
//                 <div className="flex items-center gap-3 mb-8">
//                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
//                     <Upload size={24} />
//                   </div>
//                   <div>
//                     <h2 className="text-2xl font-bold text-slate-800">Verification Vault</h2>
//                     <p className="text-sm text-slate-400 font-medium">Upload high-quality scans of your documents.</p>
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {requiredDocuments.map((doc) => (
//                     <div key={doc} className="group relative flex flex-col p-5 border-2 border-slate-50 rounded-[24px] bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300">
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
//                           <FileCheck size={20} />
//                         </div>
//                         {uploadedFiles[doc] && <CheckCircle className="text-emerald-500" size={18} />}
//                       </div>
//                       <p className="text-[13px] font-bold text-slate-700">{doc}</p>
//                       <p className="text-[11px] text-slate-400 mt-0.5">PDF or High-res Image</p>
                      
//                       <label className="mt-4 cursor-pointer">
//                         <span className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${uploadedFiles[doc] ? 'bg-emerald-50 text-emerald-600' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}`}>
//                           {uploadedFiles[doc] ? 'Re-upload' : 'Select File'}
//                           <ArrowRight size={14} />
//                         </span>
//                         <input type="file" className="hidden" onChange={(e) => handleFileChange(doc, e)} />
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </section>
//           </div>

//           {/* Side Panel: Analysis & Progress */}
//           <aside className="xl:col-span-4 space-y-6 sticky top-10">
            
//             {/* Status Card */}
//             <div className="bg-[#1E1B4B] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
//               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
//               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
//               <div className="relative z-10">
//                 <h3 className="text-xl font-bold mb-1 tracking-tight uppercase text-indigo-300">Verify Loan  Details</h3>
//                 <p className="text-sm text-indigo-100/60 mb-8 leading-relaxed font-medium">Our verification is ready to audit your application instantly.</p>
                
//                 {status === 'idle' && (
//                   <button 
//                     onClick={submitToAgent}
//                     disabled={!formData.fullName}
//                     className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Start Verification
//                   </button>
//                 )}

//                 {status === 'processing' && (
//                   <div className="flex flex-col items-center justify-center py-10">
//                     <div className="relative">
//                       <div className="absolute inset-0 rounded-full bg-indigo-400 blur-xl opacity-20 animate-pulse"></div>
//                       <Loader2 className="animate-spin text-white relative" size={56} />
//                     </div>
//                     <p className="mt-6 font-bold tracking-widest text-xs uppercase animate-pulse">Reviewing Credit History...</p>
//                   </div>
//                 )}

//                 {(status === 'approved' || status === 'rejected') && (
//                   <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center animate-in fade-in zoom-in duration-500">
//                     {status === 'approved' ? (
//                       <>
//                         <div className="mx-auto w-20 h-20 bg-emerald-400/20 border border-emerald-400/30 rounded-full flex items-center justify-center mb-6">
//                           <CheckCircle className="text-emerald-400" size={40} />
//                         </div>
//                         <h3 className="text-3xl font-black text-emerald-400">Pre-Approved</h3>
//                         <p className="text-indigo-100/70 text-sm mt-3 leading-relaxed">System validated all criteria. Next steps sent to your email.</p>
//                       </>
//                     ) : (
//                       <>
//                         <div className="mx-auto w-20 h-20 bg-rose-400/20 border border-rose-400/30 rounded-full flex items-center justify-center mb-6">
//                           <XCircle className="text-rose-400" size={40} />
//                         </div>
//                         <h3 className="text-3xl font-black text-rose-400">Review Flagged</h3>
//                         <p className="text-indigo-100/70 text-sm mt-3 leading-relaxed">Agent detected risks in credit scoring or documentation. Manual review triggered.</p>
//                       </>
//                     )}
                    
//                     <button 
//                       onClick={() => setStatus('idle')}
//                       className="mt-8 text-[11px] font-bold uppercase tracking-widest text-indigo-300 hover:text-white transition-colors border-b border-indigo-300/30"
//                     >
//                       New Application
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>

//           </aside>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Reusable Refined Components
// const InputField = ({ label, name, type = "text", placeholder, onChange, icon }: any) => (
//   <div className="flex flex-col gap-2 group">
//     <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide flex items-center gap-2 group-focus-within:text-indigo-600 transition-colors">
//       {label}
//     </label>
//     <div className="relative">
//       {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors">{icon}</div>}
//       <input 
//         name={name}
//         type={type}
//         placeholder={placeholder}
//         onChange={onChange}
//         className={`w-full ${icon ? 'pl-12' : 'pl-4'} p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300`}
//       />
//     </div>
//   </div>
// );

// const ProgressItem = ({ label, complete, count }: { label: string, complete: boolean, count?: string }) => (
//   <div className="flex items-center justify-between">
//     <div className="flex items-center gap-3">
//       <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${complete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
//         <CheckCircle size={14} className={complete ? 'opacity-100' : 'opacity-30'} />
//       </div>
//       <span className={`text-[13px] font-bold ${complete ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
//     </div>
//     {count && <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{count}</span>}
//   </div>
// );










