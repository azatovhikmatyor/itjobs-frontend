
import React, { useState } from 'react';
import { UserProfile, Job, Application } from '../types';
import { JobCard } from './JobCard';
import { ProfileSettings } from './ProfileSettings';

interface DashboardProps {
  profile: UserProfile;
  jobs: Job[];
  applications: Application[];
  onApply: (job: Job) => void;
  onClearProfile: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateApplication: (app: Application) => void;
}

type View = 'jobs' | 'applications' | 'profile';

export const Dashboard: React.FC<DashboardProps> = ({ 
  profile, 
  jobs, 
  applications, 
  onApply, 
  onClearProfile, 
  onUpdateProfile,
  onUpdateApplication 
}) => {
  const [activeView, setActiveView] = useState<View>('jobs');

  const getMatchScore = (jobSkills: string[], userSkills: string[]) => {
    // Simple mock logic for MVP: overlap of skills
    const matchCount = jobSkills.filter(s => userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()))).length;
    // Base score + skill match
    return Math.min(98, 60 + (matchCount * 10)); 
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'interviewing': return 'bg-purple-100 text-purple-700';
      case 'offer': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfileSettings profile={profile} onSave={onUpdateProfile} />;
      
      case 'applications':
        return (
          <div className="max-w-5xl mx-auto">
             <header className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Your Applications</h2>
                  <p className="text-slate-500">Track and manage your job search progress.</p>
                </div>
                <div className="text-sm text-slate-500">
                  Total: <span className="font-semibold text-slate-900">{applications.length}</span>
                </div>
             </header>
             <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="text-lg font-medium text-slate-800">No applications yet</h3>
                    <p className="text-slate-500 mb-6">Start by finding a job match in your feed.</p>
                    <button onClick={() => setActiveView('jobs')} className="text-blue-600 hover:underline">Go to Jobs Feed &rarr;</button>
                  </div>
                ) : (
                  applications.map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    return (
                      <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 lg:items-center">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-800">{job ? job.job_title : 'Unknown Job'}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                           </div>
                           <p className="text-slate-600 font-medium">{job ? job.company : 'Unknown Company'}</p>
                           <p className="text-xs text-slate-400 mt-2">
                             Created: {new Date(app.createdAt).toLocaleDateString()}
                           </p>
                         </div>

                         <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                              <select 
                                value={app.status}
                                onChange={(e) => onUpdateApplication({...app, status: e.target.value as any})}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:border-blue-500 hover:border-slate-400 transition-colors"
                              >
                                <option value="draft">Draft</option>
                                <option value="tailoring">Tailoring</option>
                                <option value="ready">Ready to Apply</option>
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-slate-500 uppercase">Date Applied</label>
                              <input 
                                type="date"
                                value={app.dateApplied || ''}
                                onChange={(e) => onUpdateApplication({...app, dateApplied: e.target.value})}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:border-blue-500 hover:border-slate-400 transition-colors"
                              />
                            </div>
                         </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        );

      case 'jobs':
      default:
        return (
          <>
            <header className="flex justify-between items-center mb-8">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">Your Recommended Jobs</h2>
                 <p className="text-slate-500">Matched based on your profile and skills.</p>
               </div>
               <div className="flex gap-2">
                 <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
                    Skills found: {profile.parsedSkills.length}
                 </span>
                 <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
                    Level: {profile.experienceLevel}
                 </span>
               </div>
            </header>
    
            <div className="grid gap-4">
               {jobs.map(job => (
                 <JobCard 
                   key={job.id} 
                   job={job} 
                   matchPercentage={getMatchScore(job.skills, profile.parsedSkills)}
                   onApply={onApply}
                 />
               ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-400">✦</span> IT-JOBS agent
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveView('jobs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'jobs' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Feed
          </button>
          
          <button 
            onClick={() => setActiveView('applications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'applications' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Applications ({applications.length})
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'profile' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             Profile Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                 {profile.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-medium text-white truncate">{profile.name}</p>
                 <button onClick={onClearProfile} className="text-xs text-slate-500 hover:text-red-400">Sign Out</button>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
         {renderContent()}
      </main>
    </div>
  );
};