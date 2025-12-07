
import React, { useEffect, useState } from 'react';
import { Job, UserProfile, Application, ATSAnalysis } from '../types';
import { researchCompany, tailorResume, generateCoverLetter, analyzeATS } from '../services/geminiService';

interface AgentWorkModalProps {
  job: Job;
  userProfile: UserProfile;
  onClose: () => void;
  onSaveApplication: (app: Application) => void;
}

type LogType = 'system' | 'ats' | 'research' | 'tailor' | 'cover' | 'success' | 'info';

interface LogEntry {
  message: string;
  type: LogType;
  timestamp: string;
}

export const AgentWorkModal: React.FC<AgentWorkModalProps> = ({ job, userProfile, onClose, onSaveApplication }) => {
  const [step, setStep] = useState<'ats' | 'research' | 'tailor' | 'review'>('ats');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [researchData, setResearchData] = useState<{summary: string, links: string[]} | null>(null);
  const [atsData, setAtsData] = useState<ATSAnalysis | null>(null);
  const [tailoredResume, setTailoredResume] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ats' | 'resume' | 'coverLetter'>('ats');

  const addLog = (message: string, type: LogType = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  useEffect(() => {
    let mounted = true;

    const runAgent = async () => {
      if (!mounted) return;
      
      // Step 1: ATS Analysis (Pre-check)
      addLog(`Agent initializing... Target: ${job.company}`, 'system');
      await new Promise(r => setTimeout(r, 600)); 
      
      addLog("Running ATS Compliance Check...", 'ats');
      const atsResult = await analyzeATS(userProfile.resumeText, job);
      if(!mounted) return;
      setAtsData(atsResult);
      addLog(`Initial ATS Score: ${atsResult.score}/100`, 'info');

      // Step 2: Research
      setStep('research');
      addLog(`Researching ${job.company} culture & news...`, 'research');
      const research = await researchCompany(job.company);
      if(!mounted) return;
      setResearchData(research);
      addLog("Research complete.", 'success');

      // Step 3: Tailor Resume
      setStep('tailor');
      addLog("Optimizing resume with ATS keywords...", 'tailor');
      const newResume = await tailorResume(userProfile.resumeText, job);
      if(!mounted) return;
      setTailoredResume(newResume);
      setActiveTab('resume'); // Switch view to resume as it's being built
      addLog("Resume adapted.", 'success');

      // Step 4: Cover Letter
      addLog("Drafting custom cover letter...", 'cover');
      const letter = await generateCoverLetter(userProfile.resumeText, job, research.summary);
      if(!mounted) return;
      setCoverLetter(letter);
      addLog("Cover letter ready.", 'success');

      setStep('review');
    };

    runAgent();

    return () => { mounted = false; };
  }, [job, userProfile]);

  const handleSave = () => {
    const app: Application = {
      id: Math.random().toString(36).substr(2, 9),
      jobId: job.id,
      status: 'applied',
      tailoredResume,
      coverLetter,
      atsAnalysis: atsData || undefined,
      companyResearch: researchData?.links || [],
      matchScore: atsData?.score || 85, 
      createdAt: new Date().toISOString(),
      dateApplied: new Date().toISOString().split('T')[0]
    };
    onSaveApplication(app);
  };

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case 'system':
        return (
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'ats':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'research':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'tailor':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'cover':
        return (
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* Sidebar / Progress */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col shrink-0">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{job.job_title}</h3>
            <p className="text-sm text-slate-500 mt-1">{job.company}</p>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 animate-fadeIn">
                <span className="mt-0.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">{log.timestamp}</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {getLogIcon(log.type)}
                    <span className="text-xs text-slate-700 font-medium leading-tight">{log.message}</span>
                  </div>
                </div>
              </div>
            ))}
            {step !== 'review' && (
              <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse font-medium mt-2 pl-[46px]">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Processing...
              </div>
            )}
          </div>

          {/* ATS Summary Widget */}
          {atsData && (
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg mb-4 border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">ATS Match</span>
                </div>
                <span className={`text-lg font-bold ${atsData.score >= 80 ? 'text-green-400' : atsData.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {atsData.score}%
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${atsData.score >= 80 ? 'bg-green-500' : atsData.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${atsData.score}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Research Summary Widget */}
          {researchData && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs mb-4 shadow-sm">
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Company Insights
              </h4>
              <p className="text-slate-600 mb-2 line-clamp-3 leading-relaxed">{researchData.summary}</p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-200">
            {step === 'review' && (
              <a 
                href={job.job_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium text-xs"
              >
                <span>Link to Job Post</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
            
            <div className="flex gap-2">
               <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium">
                 Cancel
               </button>
               <button 
                  onClick={handleSave} 
                  disabled={step !== 'review'}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all text-sm flex items-center justify-center gap-2 ${step === 'review' ? 'bg-slate-900 hover:bg-slate-800 shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Track Applied
               </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-6 shadow-sm z-10">
            <button 
              onClick={() => setActiveTab('ats')}
              className={`h-full text-sm font-medium border-b-2 px-1 transition-colors flex items-center gap-2 ${activeTab === 'ats' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              ATS Analysis
            </button>
            <button 
              onClick={() => setActiveTab('resume')}
              className={`h-full text-sm font-medium border-b-2 px-1 transition-colors flex items-center gap-2 ${activeTab === 'resume' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Tailored Resume
            </button>
            <button 
              onClick={() => setActiveTab('coverLetter')}
              className={`h-full text-sm font-medium border-b-2 px-1 transition-colors flex items-center gap-2 ${activeTab === 'coverLetter' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Cover Letter
            </button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'ats' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                {!atsData ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                    <p className="font-medium text-slate-500">Analyzing resume compatibility...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        ATS Compatibility Report
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                          <div className="text-3xl font-bold text-slate-800 mb-1">{atsData.score}/100</div>
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Overall Match</div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                          <div className="text-3xl font-bold text-red-500 mb-1">{atsData.missingKeywords.length}</div>
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Missing Keywords</div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                           <div className="text-3xl font-bold text-slate-800 mb-1">{atsData.formattingIssues.length}</div>
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Formatting Flags</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                        <h5 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                           <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           Missing Keywords
                        </h5>
                        <div className="flex flex-wrap gap-2 content-start">
                          {atsData.missingKeywords.length > 0 ? (
                            atsData.missingKeywords.map(kw => (
                              <span key={kw} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg w-full">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                               <span className="text-sm font-medium">All key skills detected!</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                        <h5 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          AI Suggestions
                        </h5>
                        <ul className="space-y-3">
                          {atsData.suggestions.map((sugg, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {sugg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'resume' && (
               tailoredResume ? (
                <div className="bg-white shadow-sm border border-slate-200 p-10 min-h-full rounded-xl max-w-4xl mx-auto prose prose-slate prose-sm animate-fadeIn">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{tailoredResume}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium text-slate-500">Tailoring resume to job description...</p>
                </div>
              )
            )}

            {activeTab === 'coverLetter' && (
              coverLetter ? (
                <div className="bg-white shadow-sm border border-slate-200 p-10 min-h-full rounded-xl max-w-4xl mx-auto prose prose-slate prose-sm animate-fadeIn">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{coverLetter}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                   <p className="font-medium text-slate-500">Drafting cover letter...</p>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
