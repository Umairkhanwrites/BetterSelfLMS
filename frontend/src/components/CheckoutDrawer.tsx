'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getCurrentAuthToken, uploadReceiptImage } from '@/lib/firebaseClient';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    courseId: string;
    title: string;
    pricePKR: number;
    instructorName: string;
  };
  onSuccess: () => void;
}

export default function CheckoutDrawer({
  isOpen,
  onClose,
  course,
  onSuccess
}: CheckoutDrawerProps) {
  const [activeTab, setActiveTab] = useState<'JazzCash' | 'EasyPaisa' | 'Bank Transfer'>('JazzCash');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentAccounts = {
    JazzCash: {
      title: 'JazzCash Wallet',
      accountTitle: 'BetterSelf Mental Health PVT',
      accountNumber: '0300-1234567',
      instructions: 'Send exact PKR amount to this JazzCash mobile account, then copy the 10-12 digit TID from the SMS receipt.'
    },
    EasyPaisa: {
      title: 'EasyPaisa Wallet',
      accountTitle: 'BetterSelf Wellness Clinic',
      accountNumber: '0345-9876543',
      instructions: 'Transfer to this EasyPaisa wallet number and paste the Transaction ID generated in your app receipt.'
    },
    'Bank Transfer': {
      title: 'Habib Bank Limited (HBL)',
      accountTitle: 'BetterSelf Health Technologies',
      accountNumber: 'PK88HABB0001234567890123',
      instructions: 'Make Raast or IBFT transfer from any Pakistani bank app using this IBAN and attach screenshot proof.'
    }
  };

  const currentDetails = paymentAccounts[activeTab];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!transactionId.trim()) {
      setErrorMsg('Please enter your Transaction ID (TID).');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getCurrentAuthToken();
      if (!token) {
        setErrorMsg('Please sign in first to submit your enrollment.');
        return;
      }

      let receiptImageUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80';
      if (receiptFile) {
        receiptImageUrl = await uploadReceiptImage(receiptFile);
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/enrollments/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.courseId,
          paymentMethod: activeTab,
          transactionId: transactionId.trim(),
          receiptImageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enrollment request');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ddedf8] text-[#206394] border border-[#c1e0f3] text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2988C6]" />
              Verified Local Wallet Checkout
            </div>
            <h2 className="text-xl font-bold text-slate-900">Enrollment Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course Summary Card */}
        <div className="p-6 space-y-6 flex-1">
          <div className="p-4 rounded-xl bg-[#ddedf8]/60 border border-[#c1e0f3]">
            <p className="text-xs font-bold text-[#206394] uppercase tracking-wider">Course Selection</p>
            <h3 className="font-bold text-slate-900 text-sm mt-0.5">{course.title}</h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#c1e0f3]/70">
              <span className="text-xs text-slate-600">Total Investment</span>
              <span className="text-lg font-black text-[#102a3f]">PKR {course.pricePKR.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Pakistan Wallet / Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['JazzCash', 'EasyPaisa', 'Bank Transfer'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setActiveTab(method)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    activeTab === method
                      ? 'border-[#2988C6] bg-[#2988C6] text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Account Details Box with 1-click Copy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Account Title</p>
                <p className="text-sm font-bold text-slate-900">{currentDetails.accountTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDetails.accountTitle, 'title')}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Copy Title"
              >
                {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Account / IBAN Number</p>
                <p className="text-sm font-mono font-bold text-teal-800 break-all">{currentDetails.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDetails.accountNumber, 'number')}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Copy Account Number"
              >
                {copiedField === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              {currentDetails.instructions}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction ID (TID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 0293847561"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2988C6] focus:ring-1 focus:ring-[#2988C6] text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Screenshot / Receipt Proof
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-teal-500 transition-colors cursor-pointer relative bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center py-2">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <p className="text-xs font-medium text-slate-700">
                    {receiptFile ? receiptFile.name : 'Click or drop payment screenshot'}
                  </p>
                  <p className="text-[10px] text-slate-400">PNG, JPG up to 10MB</p>
                </div>
              </div>

              {receiptPreview && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 max-h-32">
                  <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Verification Guarantee Note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p>
                <strong>Human Verification:</strong> Submitting your Transaction ID (TID) routes your receipt directly to our administrative team for verification and approval.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#66B151] hover:bg-[#589c44] disabled:bg-slate-400 text-white font-extrabold text-sm shadow-lg shadow-[#66B151]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Receipt...
                </>
              ) : (
                <>
                  <span>Submit Proof for Admin Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Direct human verification by BetterSelf administrative staff.
          </p>
        </div>
      </div>
    </div>
  );
}
