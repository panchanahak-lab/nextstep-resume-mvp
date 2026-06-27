import React from 'react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import Badge from '../../../../packages/shared/src/components/Badge';
import { COPY } from '@nextstep/shared';

interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
  paperMode?: boolean;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, className = '', paperMode = false }) => {
  const isEmpty = !data.name && !data.title && !data.summary && data.experience.length === 0;
  const primaryText = paperMode ? 'text-neutral-900' : 'text-neutral-900 dark:text-white';
  const bodyText = paperMode ? 'text-neutral-700' : 'text-neutral-700 dark:text-neutral-300';
  const secondaryText = paperMode ? 'text-neutral-600' : 'text-neutral-600 dark:text-neutral-400';
  const mutedText = paperMode ? 'text-neutral-500' : 'text-neutral-500 dark:text-neutral-400';
  const sectionText = paperMode ? 'text-neutral-500' : 'text-neutral-400 dark:text-neutral-500';
  const borderClass = paperMode ? 'border-neutral-200' : 'border-neutral-200 dark:border-neutral-700';
  const cardClass = paperMode ? '!bg-white dark:!bg-white !border-neutral-200 dark:!border-neutral-200 !text-neutral-900 !shadow-none !rounded-none' : '';
  const paperBadgeClass = paperMode ? '!bg-neutral-100 dark:!bg-neutral-100 !text-neutral-700 dark:!text-neutral-700' : '';

  if (isEmpty) {
    return (
      <Card className={`resume-preview-card p-6 lg:p-8 flex items-center justify-center min-h-[500px] bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed ${className}`}>
        <p className={`${mutedText} text-center`}>
          {COPY.BUILDER.emptyState}
        </p>
      </Card>
    );
  }

  return (
    <Card className={`resume-preview-card p-6 lg:p-8 ${cardClass} ${className}`}>
      <div className="mb-4">
        <h2 className={`text-xl font-bold ${primaryText}`}>{data.name}</h2>
        <p className="text-primary-600 font-medium">{data.title}</p>
        <p className={`text-sm ${mutedText} mt-1`}>
          {data.location} | {data.email} | {data.phone}
        </p>
      </div>

      <hr className={`${borderClass} mb-4`} />

      {data.summary && (
        <div className="mb-5">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${sectionText} mb-2`}>Summary</h3>
          <p className={`text-sm ${bodyText} leading-relaxed`}>{data.summary}</p>
        </div>
      )}

      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${sectionText} mb-3`}>Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp, index) => (
              <div key={index}>
                <p className={`font-medium ${primaryText} text-sm`}>{exp.jobTitle}</p>
                <p className={`text-sm ${mutedText}`}>
                  {exp.company} | {exp.startDate} - {exp.endDate}
                </p>
                <p className={`text-sm ${secondaryText} mt-1 leading-relaxed`}>{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${sectionText} mb-3`}>Education</h3>
          <div className="space-y-2">
            {data.education.map((edu, index) => (
              <div key={index}>
                <p className={`font-medium ${primaryText} text-sm`}>{edu.degree}</p>
                <p className={`text-sm ${mutedText}`}>
                  {edu.institute} | {edu.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${sectionText} mb-3`}>Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <Badge key={index} className={paperBadgeClass}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.projects && data.projects.length > 0 && (
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${sectionText} mb-3`}>Projects</h3>
          <div className="space-y-3">
            {data.projects.map((project, index) => (
              <div key={index}>
                <p className={`font-medium ${primaryText} text-sm`}>{project.name}</p>
                <p className={`text-sm ${secondaryText} mt-1`}>{project.description}</p>
                <p className={`text-xs ${mutedText} mt-1`}>Tools: {project.tools}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResumePreview;
