import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ResumeData } from '../../types/resume';

const PdfDocument = Document as unknown as React.ComponentType<any>;
const PdfPage = Page as unknown as React.ComponentType<any>;
const PdfText = Text as unknown as React.ComponentType<any>;
const PdfView = View as unknown as React.ComponentType<any>;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingRight: 42,
    paddingBottom: 36,
    paddingLeft: 42,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.35,
    color: '#111827',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 5,
  },
  contact: {
    fontSize: 9.5,
    color: '#374151',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#111827',
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  bodyText: {
    marginBottom: 3,
  },
  item: {
    marginBottom: 8,
  },
  itemHeader: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  itemMeta: {
    color: '#4b5563',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletMarker: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  skills: {
    lineHeight: 1.4,
  },
});

const hasText = (value?: string) => Boolean(value?.trim());

const splitLines = (value: string) => {
  return value
    .split(/\r?\n|(?:\.\s+)/)
    .map((item) => item.replace(/^[\-*•]\s*/, '').trim())
    .filter(Boolean);
};

const contactLine = (data: ResumeData) => {
  return [data.location, data.email, data.phone].filter(hasText).join(' | ');
};

const TextSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <PdfView style={styles.section}>
    <PdfText style={styles.sectionTitle}>{title}</PdfText>
    {children}
  </PdfView>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <PdfView>
    {items.map((item, index) => (
      <PdfView key={`${item}-${index}`} style={styles.bulletRow}>
        <PdfText style={styles.bulletMarker}>-</PdfText>
        <PdfText style={styles.bulletText}>{item}</PdfText>
      </PdfView>
    ))}
  </PdfView>
);

const ResumePDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const validExperience = data.experience.filter((item) =>
    [item.jobTitle, item.company, item.startDate, item.endDate, item.description].some(hasText),
  );
  const validEducation = data.education.filter((item) =>
    [item.degree, item.institute, item.year].some(hasText),
  );
  const validProjects = (data.projects ?? []).filter((item) =>
    [item.name, item.description, item.tools].some(hasText),
  );
  const validSkills = (data.skills ?? []).filter(hasText);
  const validCertifications = (data.certifications ?? []).filter(hasText);
  const validAchievements = (data.achievements ?? []).filter(hasText);

  return (
    <PdfDocument title={`${data.name || 'NextStep'} Resume`} author="NextStep Resume">
      <PdfPage size="A4" style={styles.page} wrap>
        <PdfView style={styles.header}>
          <PdfText style={styles.name}>{data.name.trim()}</PdfText>
          {hasText(data.title) && <PdfText style={styles.title}>{data.title.trim()}</PdfText>}
          {hasText(contactLine(data)) && <PdfText style={styles.contact}>{contactLine(data)}</PdfText>}
        </PdfView>

        {hasText(data.summary) && (
          <TextSection title="Summary">
            <PdfText style={styles.bodyText}>{data.summary.trim()}</PdfText>
          </TextSection>
        )}

        {validExperience.length > 0 && (
          <TextSection title="Work Experience">
            {validExperience.map((experience, index) => (
              <PdfView key={`${experience.company}-${index}`} style={styles.item}>
                <PdfText style={styles.itemHeader}>
                  {[experience.jobTitle, experience.company].filter(hasText).join(' - ')}
                </PdfText>
                {[experience.startDate, experience.endDate].some(hasText) && (
                  <PdfText style={styles.itemMeta}>
                    {[experience.startDate, experience.endDate].filter(hasText).join(' - ')}
                  </PdfText>
                )}
                {hasText(experience.description) && <BulletList items={splitLines(experience.description)} />}
              </PdfView>
            ))}
          </TextSection>
        )}

        {validEducation.length > 0 && (
          <TextSection title="Education">
            {validEducation.map((education, index) => (
              <PdfView key={`${education.institute}-${index}`} style={styles.item}>
                <PdfText style={styles.itemHeader}>{education.degree.trim()}</PdfText>
                <PdfText style={styles.itemMeta}>
                  {[education.institute, education.year].filter(hasText).join(' - ')}
                </PdfText>
              </PdfView>
            ))}
          </TextSection>
        )}

        {validSkills.length > 0 && (
          <TextSection title="Skills">
            <PdfText style={styles.skills}>{validSkills.join(', ')}</PdfText>
          </TextSection>
        )}

        {validProjects.length > 0 && (
          <TextSection title="Projects">
            {validProjects.map((project, index) => (
              <PdfView key={`${project.name}-${index}`} style={styles.item}>
                {hasText(project.name) && <PdfText style={styles.itemHeader}>{project.name.trim()}</PdfText>}
                {hasText(project.description) && <BulletList items={splitLines(project.description)} />}
                {hasText(project.tools) && <PdfText style={styles.itemMeta}>Tools: {project.tools.trim()}</PdfText>}
              </PdfView>
            ))}
          </TextSection>
        )}

        {validCertifications.length > 0 && (
          <TextSection title="Certifications">
            <BulletList items={validCertifications} />
          </TextSection>
        )}

        {validAchievements.length > 0 && (
          <TextSection title="Achievements">
            <BulletList items={validAchievements} />
          </TextSection>
        )}
      </PdfPage>
    </PdfDocument>
  );
};

export default ResumePDF;
