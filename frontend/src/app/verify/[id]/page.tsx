'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  Calendar,
  User,
  BookOpen,
  Share2,
  Sparkles
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!certId) return;

    const verify = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/verify/${certId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Certificate not verified');
        }
        setData(result);
      } catch (err: any) {
        setErrorMsg(err.message || 'Credential validation failed');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [certId]);

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-slate-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Verifying credential against BetterSelf LMS registry...</p>
          </div>
        ) : errorMsg || !data?.isValid ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Unverified Credential</h1>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              {errorMsg || 'We could not find an issued certificate matching ID ' + certId}
            </p>
            <p className="text-xs text-slate-400">
              Please double check the URL or contact BetterSelf support.
            </p>
          </div>
        ) : (
          <div>
            {/* Valid Badge Header (Logo Blue Foundation) */}
            <div className="bg-gradient-to-r from-[#102a3f] via-[#1d4666] to-[#102a3f] p-8 text-white text-center relative overflow-hidden border-b border-[#3B97D3]/40">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CC157]/20 text-[#ccedbc] border border-[#7CC157]/40 text-xs font-bold mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC157]" />
                Verified Authentic BetterSelf Credential
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Certificate of Clinical Mastery
              </h1>
              <p className="text-xs text-[#94c9eb] mt-2 font-mono">
                Credential ID: {data.certificate.certificateId}
              </p>
            </div>

            {/* Credential Attributes */}
            <div className="p-8 space-y-6">
              <div className="p-5 rounded-2xl bg-[#ddedf8]/40 border border-[#c1e0f3] space-y-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Recipient Name</span>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                    <User className="w-5 h-5 text-[#3B97D3]" />
                    {data.certificate.userName}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#c1e0f3]/70">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Course Completed</span>
                  <p className="text-base font-extrabold text-[#102a3f] flex items-center gap-2 mt-0.5">
                    <BookOpen className="w-4 h-4 text-[#3B97D3]" />
                    {data.certificate.courseTitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#c1e0f3]/70">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Clinical Instructor</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {data.certificate.instructorName}
                    </p>
                    <p className="text-[10px] text-slate-500">{data.certificate.instructorTitle}</p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Issue Date</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#3B97D3]" />
                      {new Date(data.certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7CC157]" />
                  Cryptographically registered on Cloud Firestore
                </span>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'BetterSelf Verified Certificate',
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Verification URL copied to clipboard for LinkedIn!');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7CC157] hover:bg-[#6eb249] text-white font-extrabold shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share to LinkedIn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
