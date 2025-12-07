import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    jobTitle: profile.jobTitle || '',
    locations: profile.preferences?.desiredLocations?.join(', ') || '',
    industries: profile.preferences?.interestedIndustries?.join(', ') || '',
    salaryRange: profile.preferences?.salaryRange || '',
    workMode: profile.preferences?.workMode || 'Any'
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: formData.name,
      email: formData.email,
      jobTitle: formData.jobTitle,
      preferences: {
        desiredLocations: formData.locations.split(',').map(s => s.trim()).filter(Boolean),
        interestedIndustries: formData.industries.split(',').map(s => s.trim()).filter(Boolean),
        salaryRange: formData.salaryRange,
        workMode: formData.workMode as any
      }
    };
    onSave(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Profile Settings</h2>
        <p className="text-slate-500">Manage your personal information and job preferences.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="jane@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Occupation / Title</label>
              <input 
                type="text" 
                name="jobTitle" 
                value={formData.jobTitle} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Job Preferences</h3>
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Desired Locations (comma separated)</label>
                    <input 
                      type="text" 
                      name="locations" 
                      value={formData.locations} 
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="San Francisco, Remote, London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Mode</label>
                    <div className="relative">
                      <select 
                        name="workMode" 
                        value={formData.workMode} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-Site">On-Site</option>
                        <option value="Any">Any</option>
                      </select>
                      <svg className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interested Industries</label>
                  <input 
                    type="text" 
                    name="industries" 
                    value={formData.industries} 
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Fintech, AI, Health"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary Range</label>
                  <input 
                    type="text" 
                    name="salaryRange" 
                    value={formData.salaryRange} 
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="$120k - $150k"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
             <h3 className="text-lg font-semibold text-slate-800 mb-2">Resume Data</h3>
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-sm font-medium text-slate-600">Experience Level: <span className="text-slate-900">{profile.experienceLevel}</span></span>
                 <span className="text-xs text-slate-400">Parsed from upload</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {profile.parsedSkills.map(skill => (
                   <span key={skill} className="px-2 py-1 bg-white border border-slate-200 text-xs text-slate-600 rounded">
                     {skill}
                   </span>
                 ))}
               </div>
               <p className="mt-3 text-xs text-slate-400 italic">To update resume data, please re-upload your resume.</p>
             </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
           {isSaved && <span className="text-green-600 text-sm font-medium animate-fade-in">Changes saved successfully!</span>}
           <button 
             type="submit" 
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
           >
             Save Settings
           </button>
        </div>
      </form>
    </div>
  );
};