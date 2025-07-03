import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, SparklesIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { aiResumeAPI } from '../api/aiResume.js';
import DynamicField from '../components/DynamicField.js';
import Button from '../components/Button.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import { resumeFieldsConfig, RESUME_TYPES } from '../config/fields.js';
import { validateForm, isFormValid } from '../utils/validation.js';


const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [resumeType, setResumeType] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  // Initialize form data when resume type changes
  useEffect(() => {
    if (resumeType && resumeFieldsConfig[resumeType]) {
      const initialData = {};
      resumeFieldsConfig[resumeType].fields.forEach(field => {
        if (field.type === 'array') {
          initialData[field.id] = [];
        } else {
          initialData[field.id] = '';
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [resumeType]);

  // Validate form on data change
  useEffect(() => {
    if (resumeType && Object.keys(formData).length > 0) {
      const newErrors = validateForm(formData, resumeFieldsConfig[resumeType]?.fields || []);
      setErrors(newErrors);
    }
  }, [formData, resumeType]);

  // Fetch resume data if editing
  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const response = await aiResumeAPI.getResumeById(editId);
          if (response.success && response.data) {
            console.log('Loaded resume for editing:', response.data);
            if (!response.data.resumeType) {
              console.warn('resumeType missing from resume data, defaulting to FRESHER');
            }
            setResumeType(response.data.resumeType || 'FRESHER');
            setFormData({ ...response.data });
            setShowPreview(false);
          } else {
            toast.error('Failed to load resume for editing');
          }
        } catch (err) {
          toast.error('Error loading resume for editing');
        }
      })();
    }
  }, [editId]);

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleArrayItemChange = (arrayId, index, fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayId]: prev[arrayId].map((item, i) => 
        i === index ? { ...item, [fieldKey]: value } : item
      )
    }));
  };

  const handleAddItem = (arrayId) => {
    const field = resumeFieldsConfig[resumeType].fields.find(f => f.id === arrayId);
    if (field && field.template) {
      const newItem = {};
      Object.keys(field.template).forEach(key => {
        newItem[key] = '';
      });
      
      setFormData(prev => ({
        ...prev,
        [arrayId]: [...(prev[arrayId] || []), newItem]
      }));
    }
  };

  const handleRemoveItem = (arrayId, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayId]: prev[arrayId].filter((_, i) => i !== index)
    }));
  };

  const handleGenerateResume = async () => {
    if (!isFormValid(errors)) {
      toast.error('Please fix the errors before generating your resume');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare data for backend - convert strings to arrays where needed
      const processedData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [],
        projects: formData.projects?.map(project => ({
          ...project,
          technologies: project.technologies ? project.technologies.split(',').map(tech => tech.trim()).filter(tech => tech) : []
        })) || [],
      };

      let response;
      if (editId) {
        response = await aiResumeAPI.editResume(editId, processedData);
        if (response.success) {
          toast.success('Resume updated successfully!');
          setShowPreview(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          toast.error(response.message || 'Failed to update resume');
        }
      } else {
        response = await aiResumeAPI.generateResumeWithAI(processedData);
        if (response.success) {
          const normalized = {
            ...response.data,
            workExperience: response.data.workExperience || response.data.experience || [],
            education: response.data.education || [],
            skills: response.data.skills || [],
            projects: response.data.projects || [],
            languages: response.data.languages || [],
            personalInfo: response.data.personalInfo || {},
          };
          setGeneratedResume(normalized);
          toast.success('Resume generated successfully!');
          setShowPreview(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          toast.error(response.message || 'Failed to generate resume');
        }
      }
    } catch (error) {
      console.error('Error generating/updating resume:', error);
      let backendMessage = error.response?.data?.message;
      let backendError = error.response?.data?.error;
      if (error.response?.status === 429) {
        toast.error(backendMessage || 'Rate limit exceeded. Please wait a minute before trying again.');
      } else if (backendMessage || backendError) {
        toast.error(`${backendMessage || ''}${backendError ? ' - ' + backendError : ''}`.trim());
      } else {
        toast.error('Failed to generate/update resume. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (generatedResume && generatedResume.pdfUrl) {
      try {
        console.log('Downloading from PDF URL:', generatedResume.pdfUrl);
        const response = await fetch(generatedResume.pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${generatedResume.personalInfo?.fullName || 'generated'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('PDF download started!');
      } catch (err) {
        toast.error('Failed to download PDF');
      }
    } else {
      toast.error('No backend PDF available. Please generate your resume first.');
    }
  };

  const handleBackendPDFDownload = async () => {
    // TODO: implement or leave empty
  };

  const renderTypeSelection = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your Resume</h1>
          <p className="text-lg text-gray-600">Choose your experience level to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              resumeType === RESUME_TYPES.FRESHER
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setResumeType(RESUME_TYPES.FRESHER)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fresher</h3>
              <p className="text-gray-600">Perfect for students and recent graduates</p>
            </div>
          </div>

          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              resumeType === RESUME_TYPES.EXPERIENCED
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setResumeType(RESUME_TYPES.EXPERIENCED)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentArrowDownIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Experienced</h3>
              <p className="text-gray-600">Perfect for professionals with work experience</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="lg"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );

  const renderResumeContent = (resume) => {
    if (!resume) return null;
    const p = resume.personalInfo || {};
    return (
      <div className="text-left max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200">
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{p.fullName}</h1>
          <div className="text-gray-600 mt-1 flex flex-wrap gap-4">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.address && <span>{p.address}</span>}
            {p.linkedin && p.linkedin.trim() !== '' && <span>{p.linkedin}</span>}
            {p.website && p.website.trim() !== '' && <span>{p.website}</span>}
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
        {/* Work Experience */}
        {resume.workExperience && resume.workExperience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Work Experience</h2>
            <ul>
              {resume.workExperience.map((exp, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium text-gray-900">{exp.position} - {exp.company}</div>
                  <div className="text-gray-600 text-sm">{exp.startDate} - {exp.endDate || (exp.current ? 'Present' : '')}</div>
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
        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Education</h2>
            <ul>
              {resume.education.map((edu, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium text-gray-900">{edu.degree} - {edu.institution}</div>
                  <div className="text-gray-600 text-sm">{edu.startYear || edu.startDate} - {edu.endYear || edu.endDate}</div>
                  {edu.fieldOfStudy && <div className="text-gray-700 text-sm">{edu.fieldOfStudy}</div>}
                  {edu.gpa && <div className="text-gray-700 text-sm">GPA: {edu.gpa}</div>}
                  {edu.description && <div className="text-gray-700 text-sm mt-1">{edu.description}</div>}
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
                  {proj.url && <div className="text-blue-700 text-sm"><a href={proj.url} target="_blank" rel="noopener noreferrer">{proj.url}</a></div>}
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

  const renderForm = () => {
    if (!resumeType || !resumeFieldsConfig[resumeType]) {
      return renderTypeSelection();
    }

    const config = resumeFieldsConfig[resumeType];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
                <p className="mt-2 text-gray-600">{config.description}</p>
              </div>
              <Button
                onClick={() => setResumeType(null)}
                variant="outline"
                size="sm"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Change Type
              </Button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateResume(); }}>
              <div className="space-y-8">
                {config.fields.map((field) => (
                  <div key={field.id}>
                    <DynamicField
                      field={field}
                      value={formData[field.id]}
                      onChange={handleFieldChange}
                      onAddItem={handleAddItem}
                      onRemoveItem={handleRemoveItem}
                      onArrayItemChange={handleArrayItemChange}
                      errors={errors}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {Object.keys(errors).length > 0 ? (
                      <span className="text-red-600">
                        Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} to continue
                      </span>
                    ) : (
                      <span className="text-green-600">All required fields are completed</span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!isFormValid(errors) || isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Generating Resume...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate AI Resume
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    console.log('generatedResume:', generatedResume);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div ref={previewRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            {renderResumeContent(generatedResume)}
          </div>
          <div className="space-y-3">
            <Button
              onClick={handleBackendPDFDownload}
              size="lg"
              className="w-full"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              View All Resumes
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (showPreview && generatedResume) {
    return renderPreview();
  }

  return renderForm();
};

export default ResumeBuilder; 