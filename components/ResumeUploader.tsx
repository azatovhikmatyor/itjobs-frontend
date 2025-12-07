import React, { useState } from 'react';
import { UserProfile } from '../types';
import { parseResumeToProfile } from '../services/geminiService';

interface ResumeUploaderProps {
  onProfileCreated: (profile: UserProfile) => void;
}

declare global {
  interface Window {
    mammoth: any;
  }
}

type UploadTab = 'upload' | 'manual';

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onProfileCreated }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UploadTab>('upload');
  
  // State for Manual Input
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    jobTitle: '',
    skills: '',
    experienceLevel: 'Mid',
    workMode: 'Remote',
    summary: ''
  });

  // Helper to read file as Base64 (for PDF)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:application/pdf;base64, prefix for Gemini
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const extractDocxText = async (file: File): Promise<string> => {
    if (!window.mammoth) {
      throw new Error("Word parser (Mammoth) not loaded");
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      let inputData = '';
      let mimeType = 'text/plain';

      if (file.type === 'application/pdf') {
        inputData = await fileToBase64(file);
        mimeType = 'application/pdf';
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
         // Use Client-side Mammoth for Word
         inputData = await extractDocxText(file);
         mimeType = 'text/plain';
      } else {
        // Assume text/md
        inputData = await file.text();
        mimeType = 'text/plain';
      }

      // Call Gemini
      const parsedData = await parseResumeToProfile({ data: inputData, mimeType }, false);

      const newProfile: UserProfile = {
        name: parsedData.name || "Candidate",
        email: parsedData.email || "",
        jobTitle: parsedData.jobTitle || "",
        experienceLevel: parsedData.experienceLevel || "Mid",
        parsedSkills: parsedData.parsedSkills || [],
        resumeText: parsedData.resumeText || (mimeType === 'text/plain' ? inputData : "Parsed from document"),
        preferences: {
          desiredLocations: [],
          interestedIndustries: [],
          salaryRange: '',
          workMode: 'Any'
        }
      };

      onProfileCreated(newProfile);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse resume. " + (err.message || "Please check your API key and file format."));
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.skills || !manualForm.summary) {
      setError("Please fill in all required fields to proceed.");
      return;
    }

    const newProfile: UserProfile = {
      name: manualForm.name,
      email: manualForm.email,
      jobTitle: manualForm.jobTitle,
      experienceLevel: manualForm.experienceLevel,
      parsedSkills: manualForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      resumeText: manualForm.summary,
      preferences: {
        desiredLocations: [],
        interestedIndustries: [],
        salaryRange: '',
        workMode: manualForm.workMode as any
      }
    };

    onProfileCreated(newProfile);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-white overflow-hidden backdrop-blur-sm relative animate-fadeIn">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      {/* Hero Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
          Let's Build Your Profile
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          To match you with the best opportunities, we need to understand your background. 
          Upload your resume for instant parsing, or create a profile manually.
        </p>

        {/* Custom Segmented Control */}
        <div className="flex justify-center mt-8">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'upload' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Upload Resume
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'manual' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload View */}
        {activeTab === 'upload' && (
          <div className="animate-fadeIn">
            <div className="relative group cursor-pointer max-w-xl mx-auto">
              <input 
                type="file" 
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isParsing}
              />
              <div className={`
                border-3 border-dashed rounded-2xl p-16 transition-all duration-300 transform
                ${isParsing 
                  ? 'bg-slate-50 border-slate-300 scale-[0.98]' 
                  : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/30 hover:scale-[1.01] hover:shadow-xl'
                }
              `}>
                <div className="flex flex-col items-center text-center">
                  {isParsing ? (
                    <>
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 relative">
                         <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Resume...</h3>
                      <p className="text-slate-500">Extracting skills, experience, and contact info.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Click to Upload Resume</h3>
                      <p className="text-slate-500 mb-6">Supports PDF, DOCX, TXT, MD</p>
                      <span className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-200 group-hover:bg-blue-700 transition-colors">
                        Select Document
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-8 text-xs text-slate-400 font-medium uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Secure Parsing
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Instant Analysis
              </span>
            </div>
          </div>
        )}

        {/* Manual Form View */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="max-w-4xl mx-auto animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Core Info */}
              <div className="md:col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={manualForm.name}
                      onChange={e => setManualForm({...manualForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="e.g. Alex Morgan"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={manualForm.email}
                      onChange={e => setManualForm({...manualForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="e.g. alex@example.com"
                    />
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Occupation / Title</label>
                  <input 
                    type="text" 
                    value={manualForm.jobTitle}
                    onChange={e => setManualForm({...manualForm, jobTitle: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>

                 {/* Work Preference */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Preference</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Remote', 'Hybrid', 'On-Site', 'Any'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setManualForm({...manualForm, workMode: mode})}
                        className={`py-2 px-1 text-center rounded-lg text-sm font-medium border transition-all ${
                          manualForm.workMode === mode 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Skills</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={manualForm.skills}
                      onChange={e => setManualForm({...manualForm, skills: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="e.g. React, TypeScript, Project Management, Sales"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Separate multiple skills with commas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Professional Summary</label>
                  <textarea 
                    value={manualForm.summary}
                    onChange={e => setManualForm({...manualForm, summary: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[160px] font-medium leading-relaxed resize-none"
                    placeholder="Briefly describe your background, years of experience, and what kind of roles you are looking for..."
                  ></textarea>
                </div>
              </div>

              {/* Right Column / Sidebar for Experience Level */}
              <div className="md:col-span-4 space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Experience Level</label>
                    <div className="space-y-3">
                      {['Junior', 'Mid', 'Senior', 'Lead'].map(level => (
                        <div 
                          key={level}
                          onClick={() => setManualForm({...manualForm, experienceLevel: level})}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                            manualForm.experienceLevel === level 
                              ? 'border-blue-500 bg-blue-50/50' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                             manualForm.experienceLevel === level ? 'border-blue-600' : 'border-slate-300'
                          }`}>
                            {manualForm.experienceLevel === level && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                          </div>
                          <span className={`font-semibold ${manualForm.experienceLevel === level ? 'text-blue-700' : 'text-slate-600'}`}>{level} Level</span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Action Bar */}
              <div className="col-span-1 md:col-span-12 mt-4 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.01] hover:shadow-2xl transition-all flex items-center gap-2 group"
                >
                  Create Profile
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
};