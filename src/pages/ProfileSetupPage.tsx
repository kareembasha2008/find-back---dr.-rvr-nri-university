import React, { useState } from 'react';
import { User, Department, Year, Section } from '../types';
import { authService } from '../services/authService';
import { CheckCircle2, Shield, UserCheck, ArrowRight, Building2 } from 'lucide-react';

interface ProfileSetupPageProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const DEPARTMENTS: Department[] = [
  'CSE',
  'CSE-AI & ML',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'Other',
];
const YEARS: Year[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS: Section[] = ['A', 'B', 'C', 'D', 'Other'];

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ user, onComplete }) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [studentId, setStudentId] = useState(user.student_id);
  const [department, setDepartment] = useState<Department>(user.department);
  const [year, setYear] = useState<Year>(user.year);
  const [section, setSection] = useState<Section>(user.section);

  const handleConfirm = async () => {
    try {
      const updated = await authService.confirmProfile(user.id, {
        full_name: fullName.trim() || user.full_name,
        student_id: studentId.trim().toUpperCase() || user.student_id,
        department,
        year,
        section,
      });
      onComplete(updated);
    } catch (e: any) {
      alert(e?.message || 'Failed to confirm profile.');
    }
  };

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-lg lovable-card-elevated rounded-3xl p-6 sm:p-10 border border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
          <UserCheck className="w-6 h-6" />
        </div>

        <div className="mb-8">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Registration Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Welcome to FIND BACK
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Let's complete your student profile. Please verify your Dr. RVR NRI University credentials below before proceeding to the campus dashboard.
          </p>
        </div>

        {/* Verification Summary Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm font-medium uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Gmail Address: </span>
            <span className="tabular-nums text-indigo-300">{user.university_email}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value as Year)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as Section)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Sec {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>This profile information is verified and protected across campus.</span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full mt-4 py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to FIND BACK</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
