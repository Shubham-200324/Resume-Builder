import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { aiResumeAPI } from '../api/aiResume.js';
import { toast } from 'react-hot-toast';
import { formatRelativeTime, getInitials } from '../utils/helpers.js';
import Button from '../components/Button.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  SparklesIcon,
  CloudIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';


const Dashboard = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const previewRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await aiResumeAPI.getAIResumes();
      if (response.success) {
        setResumes(response.data.resumes || []);
      } else {
        toast.error('Failed to fetch resumes');
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    setDeletingId(resumeId);
    try {
      const response = await aiResumeAPI.deleteAIResume(resumeId);
      if (response.success) {
        toast.success('Resume deleted successfully');
        // Refresh the resumes list
        fetchResumes();
      } else {
        toast.error(response.message || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewResume = (pdfUrl) => {
   
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('PDF URL not available');
    }
  };

  const handleDownloadResume = async (resume) => {
    if (resume && resume.pdfUrl) {
      try {
        const response = await fetch(resume.pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${resume.personalInfo?.fullName || 'generated'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('PDF download started!');
      } catch (err) {
        toast.error('Failed to download PDF');
      }
    } else {
      toast.error('No backend PDF available for this resume.');
    }
  };

  const renderResumeContent = (resume) => {
    if (!resume) return null;
    const p = resume.personalInfo || {};
    return (
      <div className="text-left max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200">
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{p.fullName}</h1>
          <div className="text-gray-600 mt-1">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span className="ml-4">{p.phone}</span>}
            {p.address && <span className="ml-4">{p.address}</span>}
            {p.linkedin && <span className="ml-4">{p.linkedin}</span>}
            {p.website && <span className="ml-4">{p.website}</span>}
          </div>
        </div>
        {/* Summary */}
        {resume.summary && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Summary</h2>
            <p className="text-gray-700 whitespace-pre-line">{resume.summary}</p>
          </div>
        )}
        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Skills</h2>
            <ul className="flex flex-wrap gap-2">
              {resume.skills.map((skill, idx) => (
                <li key={idx} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">{skill}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Education</h2>
            <ul>
              {resume.education.map((edu, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium text-gray-900">{edu.degree} - {edu.institution}</div>
                  <div className="text-gray-600 text-sm">{edu.startDate ? edu.startDate.substring(0, 10) : ''} - {edu.endDate ? edu.endDate.substring(0, 10) : ''}</div>
                  {edu.description && <div className="text-gray-700 text-sm mt-1">{edu.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Work Experience */}
        {resume.workExperience && resume.workExperience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Work Experience</h2>
            <ul>
              {resume.workExperience.map((exp, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium text-gray-900">{exp.position} - {exp.company}</div>
                  <div className="text-gray-600 text-sm">{exp.startDate ? exp.startDate.substring(0, 10) : ''} - {exp.endDate ? exp.endDate.substring(0, 10) : ''}</div>
                  {exp.location && <div className="text-gray-600 text-sm">{exp.location}</div>}
                  {exp.description && <div className="text-gray-700 text-sm mt-1">{exp.description}</div>}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc ml-6 text-gray-700 text-sm mt-1">
                      {exp.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Projects</h2>
            <ul>
              {resume.projects.map((proj, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium text-gray-900">{proj.name}</div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-gray-600 text-sm mb-1">Tech: {proj.technologies.join(', ')}</div>
                  )}
                  {proj.description && <div className="text-gray-700 text-sm">{proj.description}</div>}
                  {proj.url && <div className="text-blue-600 text-sm"><a href={proj.url}>{proj.url}</a></div>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Languages */}
        {resume.languages && resume.languages.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Languages</h2>
            <ul className="flex flex-wrap gap-2">
              {resume.languages.map((lang, idx) => (
                <li key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{lang.name} ({lang.proficiency})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-700">
                    {getInitials(user?.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>Member since {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  <span>{resumes.length} AI-generated resumes</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CloudIcon className="h-4 w-4 mr-2" />
                  <span>All resumes stored securely in the cloud</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <p className="text-gray-600">Create a new AI-powered resume</p>
                </div>
                <Link to="/resume-builder">
                  <Button className="flex items-center space-x-2">
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Resume</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resume History */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI-Generated Resumes</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  <span>Powered by Gemini AI</span>
                </div>
              </div>

              {resumes.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
                  <p className="text-gray-600 mb-6">Create your first AI-powered resume to get started</p>
                  <Link to="/resume-builder">
                    <Button>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {resume.personalInfo?.fullName || 'Untitled Resume'}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>{formatRelativeTime(resume.createdAt)}</span>
                            {resume.generatedByAI && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                AI Generated
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResume(resume.pdfUrl)}
                            disabled={!resume.pdfUrl}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResume(resume)}
                            disabled={!resume}
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteResume(resume._id)}
                            loading={deletingId === resume._id}
                            disabled={deletingId === resume._id}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {previewResume && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={previewRef}>{renderResumeContent(previewResume)}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 