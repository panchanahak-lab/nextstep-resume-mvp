import React from 'react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import Badge from '../../../../packages/shared/src/components/Badge';
import { COPY } from '@nextstep/shared';

interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, className = '' }) => {
  const isEmpty = !data.name && !data.title && !data.summary && data.experience.length === 0;

  if (isEmpty) {
    return (
      <Card className={`resume-preview-card p-6 lg:p-8 flex items-center justify-center min-h-[500px] bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed ${className}`}>
        <p className="text-neutral-500 dark:text-neutral-400 text-center">
          {COPY.BUILDER.emptyState}
        </p>
      </Card>
    );
  }

  return (
    <Card className={`resume-preview-card p-6 lg:p-8 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{data.name}</h2>
        <p className="text-primary-600 font-medium">{data.title}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {data.location} | {data.email} | {data.phone}
        </p>
      </div>

      <hr className="border-neutral-200 dark:border-neutral-700 mb-4" />

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Summary</h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp, index) => (
              <div key={index}>
                <p className="font-medium text-neutral-900 dark:text-white text-sm">{exp.jobTitle}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {exp.company} · {exp.startDate} – {exp.endDate}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu, index) => (
              <div key={index}>
                <p className="font-medium text-neutral-900 dark:text-white text-sm">{edu.degree}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {edu.institute} · {edu.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <Badge key={index}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Projects</h3>
          <div className="space-y-3">
            {data.projects.map((project, index) => (
              <div key={index}>
                <p className="font-medium text-neutral-900 dark:text-white text-sm">{project.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{project.description}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Tools: {project.tools}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResumePreview;
