'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Search, RefreshCcw, Briefcase, MapPin, AlertCircle, Mail, CheckCircle2, Info, Sparkles } from 'lucide-react';
import ChatAssistant from '@/components/ChatAssistant';

interface Job {
  title: string;
  link: string;
  source: string;
  snippet: string;
  hasStatusClue: boolean;
  isActivelyHiring: boolean;
  email: string | null;
  query: string;
  date: string;
  aiSummary?: string | null;
  matchScore?: number;
  actionableAdvice?: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [quotaOnly, setQuotaOnly] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) {
        throw new Error('Failed to fetch jobs.');
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs based on search query and quota status
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.source.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesQuota = quotaOnly ? job.hasStatusClue : true;
    
    return matchesSearch && matchesQuota;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header - Made sticky and optimized for mobile */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Logo and Title Section */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0">
                  <Briefcase size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight flex items-center">
                    Macau Teaching Jobs <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md border border-purple-200">AI Powered</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-0.5">
                    <MapPin size={12} className="mr-1 shrink-0" /> Recent Uploads & Visa Sponsorship Focus
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button - Full text on both mobile and desktop */}
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCcw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Results'}
            </button>
          </div>
          
          {/* Filters Bar - Mobile Optimized */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="Search jobs, schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <label className="flex items-center space-x-2 cursor-pointer select-none group bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-gray-200">
              <div className="relative flex items-center shrink-0">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  checked={quotaOnly}
                  onChange={(e) => setQuotaOnly(e.target.checked)}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex items-center">
                Requires Visa Sponsorship
                <span className="ml-1.5 text-gray-400" title="Shows employers that provide Blue Cards/Visas based on Groq AI.">
                  <Info size={14} />
                </span>
              </span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 sm:mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
            <AlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Error Loading Jobs</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border border-gray-100 px-4">
            <Search size={40} className="mx-auto text-gray-300 mb-4 sm:w-12 sm:h-12" />
            <h3 className="text-lg font-medium text-gray-900">No matching jobs found</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              Try adjusting your search query or unchecking the filter to see more results.
            </p>
          </div>
        )}

        {/* Job Cards - Mobile Optimized */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredJobs.map((job, index) => (
              <div
                key={index}
                className={`group flex flex-col bg-white rounded-xl shadow-sm border transition-all p-5 sm:p-6 relative
                  ${job.isActivelyHiring 
                    ? 'border-yellow-400 shadow-yellow-100 shadow-md hover:border-yellow-500' 
                    : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                  }
                `}
              >
                {/* GLOWING BADGE FOR URGENT / ACTIVE HIRING */}
                {job.isActivelyHiring && (
                  <div className="absolute -top-3 -right-2 sm:-right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center animate-bounce z-10">
                    <Sparkles size={10} className="mr-1 sm:w-3 sm:h-3" />
                    APPLY NOW
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-start mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {job.source}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {job.date}
                    </span>
                    {job.hasStatusClue && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={10} className="mr-1 sm:w-3 sm:h-3" />
                        Sponsorship Provided
                      </span>
                    )}
                  </div>
                  
                  <a href={job.link} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-tight">
                      {job.title}
                    </h3>
                  </a>
                  
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {job.snippet}
                  </p>

                  {job.aiSummary && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-purple-700">
                          <Sparkles size={14} className="mr-1.5" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">AI Analysis</span>
                        </div>
                        {job.matchScore !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${job.matchScore >= 80 ? 'bg-green-100 text-green-700 border-green-200' : job.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-purple-900 font-medium leading-relaxed mb-2">
                        {job.aiSummary}
                      </p>
                      {job.actionableAdvice && (
                        <div className="bg-white/60 p-2 rounded text-xs text-purple-800 border border-purple-100 mt-2">
                          <span className="font-bold">Next Step:</span> {job.actionableAdvice}
                        </div>
                      )}
                    </div>
                  )}

                  {job.email && (
                    <div className="mb-4 flex items-center p-2.5 sm:p-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <Mail size={16} className="text-blue-600 mr-2 flex-shrink-0" />
                      <a href={`mailto:${job.email}`} className="text-xs sm:text-sm text-blue-700 font-medium hover:underline truncate py-1">
                        {job.email}
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                  <span className="truncate max-w-[120px] sm:max-w-[200px]" title={job.query}>
                    Matched: {job.query}
                  </span>
                  <a 
                    href={job.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center font-medium hover:underline py-1 px-2 -mr-2 rounded-md ${job.isActivelyHiring ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50 sm:bg-transparent'}`}
                  >
                    View Post <ExternalLink size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Floating Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
