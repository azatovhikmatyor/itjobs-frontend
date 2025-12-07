
import React, { useState, useEffect } from 'react';
import { ResumeUploader } from './components/ResumeUploader';
import { Dashboard } from './components/Dashboard';
import { AgentWorkModal } from './components/AgentWorkModal';
import { UserProfile, Job, Application } from './types';
import { fetchJobs } from './services/jobService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load persistent state
    const savedProfile = localStorage.getItem('jobagent_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    const savedApps = localStorage.getItem('jobagent_apps');
    if (savedApps) {
        setApplications(JSON.parse(savedApps));
    }

    // 2. Fetch Jobs (Mock)
    const loadJobs = async () => {
      try {
        const fetchedJobs = await fetchJobs();
        setJobs(fetchedJobs);
      } catch (e) {
        console.error("App load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadJobs();
  }, []);

  const handleProfileCreated = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('jobagent_profile', JSON.stringify(profile));
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('jobagent_profile', JSON.stringify(profile));
  };

  const handleClearProfile = () => {
    setUserProfile(null);
    localStorage.removeItem('jobagent_profile');
    localStorage.removeItem('jobagent_apps');
    setApplications([]);
  };

  const handleApply = (job: Job) => {
    setActiveJob(job);
  };

  const handleSaveApplication = (app: Application) => {
    const newApps = [...applications, app];
    setApplications(newApps);
    localStorage.setItem('jobagent_apps', JSON.stringify(newApps));
    setActiveJob(null);
    alert("Application successfully prepared and saved to tracker!");
  };

  const handleUpdateApplication = (updatedApp: Application) => {
    const newApps = applications.map(app => app.id === updatedApp.id ? updatedApp : app);
    setApplications(newApps);
    localStorage.setItem('jobagent_apps', JSON.stringify(newApps));
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {!userProfile ? (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
           <header className="mb-8 text-center">
             <h1 className="text-4xl font-extrabold text-slate-800 mb-2">IT-JOBS <span className="text-blue-600">agent</span></h1>
             <p className="text-lg text-slate-500">The autonomous agent that researches, tailors, and applies for you.</p>
           </header>
           <ResumeUploader onProfileCreated={handleProfileCreated} />
           
           <div className="mt-12 text-sm text-slate-400 max-w-md text-center">
             <p>Powered by Gemini Flash & Pro.</p>
           </div>
        </div>
      ) : (
        <>
          <Dashboard 
            profile={userProfile} 
            jobs={jobs} 
            applications={applications}
            onApply={handleApply} 
            onClearProfile={handleClearProfile}
            onUpdateProfile={handleUpdateProfile}
            onUpdateApplication={handleUpdateApplication}
          />
          
          {activeJob && (
            <AgentWorkModal 
              job={activeJob}
              userProfile={userProfile}
              onClose={() => setActiveJob(null)}
              onSaveApplication={handleSaveApplication}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;