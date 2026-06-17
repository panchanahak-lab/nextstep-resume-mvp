import React from 'react';
import type { ResumeData, Experience, Education, Project } from '../../../../packages/shared/src/types';
import { COPY } from '@nextstep/shared';
import Card from '../../../../packages/shared/src/components/Card';
import Input from '../../../../packages/shared/src/components/Input';
import Textarea from '../../../../packages/shared/src/components/Textarea';
import Button from '../../../../packages/shared/src/components/Button';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    updateField('experience', updated);
  };

  const addExperience = () => {
    updateField('experience', [
      ...data.experience,
      { jobTitle: '', company: '', startDate: '', endDate: '', description: '' },
    ]);
  };

  const removeExperience = (index: number) => {
    updateField('experience', data.experience.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    updateField('education', updated);
  };

  const addEducation = () => {
    updateField('education', [
      ...data.education,
      { degree: '', institute: '', year: '' },
    ]);
  };

  const removeEducation = (index: number) => {
    updateField('education', data.education.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...(data.projects || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('projects', updated);
  };

  const addProject = () => {
    updateField('projects', [
      ...(data.projects || []),
      { name: '', description: '', tools: '' },
    ]);
  };

  const removeProject = (index: number) => {
    updateField('projects', (data.projects || []).filter((_, i) => i !== index));
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map((s) => s.trim()).filter(Boolean);
    updateField('skills', skills);
  };

  const removeSkill = (index: number) => {
    updateField('skills', data.skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} helperText={COPY.BUILDER.helpers.name} />
          <Input label="Job Title" value={data.title} onChange={(e) => updateField('title', e.target.value)} helperText={COPY.BUILDER.helpers.title} />
          <Input label="Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} helperText={COPY.BUILDER.helpers.location} />
          <Input label="Email" type="email" value={data.email} onChange={(e) => updateField('email', e.target.value)} />
          <Input label="Phone" value={data.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Professional Summary</h3>
        <Textarea
          label="Summary"
          value={data.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={4}
          helperText={COPY.BUILDER.summaryHelper}
        />
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Experience</h3>
        <div className="space-y-6">
          {data.experience.map((exp, index) => (
            <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Experience #{index + 1}</span>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Job Title" value={exp.jobTitle} onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)} />
                <Input label="Company" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} />
                <Input label="Start Date" value={exp.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} />
                <Input label="End Date" value={exp.endDate} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} />
              </div>
              <Textarea
                label="Description"
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                rows={3}
                helperText={COPY.BUILDER.helpers.experience}
              />
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-4" onClick={addExperience}>+ Add Experience</Button>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Education</h3>
        <div className="space-y-4">
          {data.education.map((edu, index) => (
            <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Education #{index + 1}</span>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Degree" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} />
                <Input label="Institute" value={edu.institute} onChange={(e) => updateEducation(index, 'institute', e.target.value)} />
                <Input label="Year" value={edu.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-4" onClick={addEducation}>+ Add Education</Button>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Skills</h3>
        <Input
          label="Skills (comma-separated)"
          value={data.skills.join(', ')}
          onChange={(e) => handleSkillsChange(e.target.value)}
          placeholder="e.g., React, TypeScript, Node.js"
          helperText={COPY.BUILDER.helpers.skills}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {data.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => removeSkill(index)}
                className="ml-1 text-primary-400 hover:text-primary-600 dark:hover:text-primary-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Projects */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Projects</h3>
        <div className="space-y-4">
          {(data.projects || []).map((project, index) => (
            <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Project #{index + 1}</span>
                <button
                  onClick={() => removeProject(index)}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
              <Input label="Project Name" value={project.name} onChange={(e) => updateProject(index, 'name', e.target.value)} />
              <Textarea
                label="Description"
                value={project.description}
                onChange={(e) => updateProject(index, 'description', e.target.value)}
                rows={3}
                helperText={COPY.BUILDER.helpers.projects}
              />
              <Input label="Tools / Technologies" value={project.tools} onChange={(e) => updateProject(index, 'tools', e.target.value)} />
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-4" onClick={addProject}>+ Add Project</Button>
      </Card>
    </div>
  );
};

export default ResumeForm;
