
import React, { useState } from 'react';
import { Job } from '../types';
import { researchCompany } from '../services/geminiService';

interface JobCardProps {
  job: Job;
  matchPercentage: number;
  onApply: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, matchPercentage, onApply }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [researchData, setResearchData] = useState<{ summary: string; links: string[] } | null>(null);

  const handleToggleResearch = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
    
    // Only fetch if we haven't already
    if (!researchData) {
      setIsLoading(true);
      try {
        const data = await researchCompany(job.company);
        setResearchData(data);
      } catch (error) {
        console.error("Research failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper to format text: removes markdown symbols and creates nice blocks
  const renderFormattedText = (text: string) => {
    // Remove all markdown bolding (**)
    const noBold = text.replace(/\*\*/g, '');
    
    // Split into lines to handle bullets or paragraphs
    const lines = noBold.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Check for bullet point markers
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
             const content = trimmed.substring(2);
             return (
               <div key={idx} className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-slate-100 text-sm text-slate-600 shadow-sm">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <span className="leading-relaxed">{content}</span>
               </div>
             );
          }
          
          return (
            <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2 bg-white/50 p-2 rounded">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {job.logo_url && (
          <img src={job.logo_url} alt={job.company} className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100" />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 truncate">{job.job_title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-900">{job.company}</span>
            <span className="text-slate-300">•</span>
            <span>{job.location}</span>
            <span className="text-slate-300">•</span>
            <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-xs">{job.salary}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {job.skills.slice(0, 4).map(skill => (
              <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="flex items-center gap-2">
             <div className="relative w-10 h-10 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className={`${matchPercentage > 75 ? 'text-emerald-500' : matchPercentage > 50 ? 'text-amber-500' : 'text-slate-400'}`} strokeDasharray={`${matchPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
               <span className="absolute text-[10px] font-bold text-slate-700">{matchPercentage}%</span>
             </div>
             <span className="text-xs font-medium text-slate-500">Match</span>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleToggleResearch}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-2 ${isExpanded ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
              title="Research Company"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <span className="md:hidden lg:inline">Research</span>
            </button>
            <button 
              onClick={() => onApply(job)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200 flex-1 md:flex-none"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Research Section */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-6 animate-fadeIn">
           {isLoading ? (
             <div className="flex items-center gap-3 text-slate-500 py-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Analyzing {job.company} with Google Search...</span>
             </div>
           ) : researchData ? (
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      AI Insights for {job.company}
                   </h4>
                   <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Powered by Google Search Grounding</span>
                </div>
                
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-1">
                   {renderFormattedText(researchData.summary)}
                </div>
                
                {researchData.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {researchData.links.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-blue-600 hover:underline hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-1.5 font-medium"
                      >
                        Source {idx + 1}
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    ))}
                  </div>
                )}
             </div>
           ) : (
             <div className="text-sm text-red-500 py-2">
               Unable to load research data. Please try again.
             </div>
           )}
        </div>
      )}
    </div>
  );
};
