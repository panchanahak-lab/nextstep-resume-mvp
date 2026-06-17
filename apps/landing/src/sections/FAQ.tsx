import React, { useState } from 'react';

const faqs = [
  {
    question: 'Is this only for engineers?',
    answer:
      'While optimized for engineering and data center roles, the platform works well for any technical professional looking to improve their resume and interview skills.',
  },
  {
    question: 'Can I use it for data center roles?',
    answer:
      'Yes! The platform includes domain-specific templates, interview questions, and terminology focused on data center operations, design, and project management.',
  },
  {
    question: 'Does it generate ATS-friendly resumes?',
    answer:
      'Yes. Our resume builder and scanner are designed to create and optimize resumes for Applicant Tracking Systems used by major companies.',
  },
  {
    question: 'Is the mock interview AI-based?',
    answer:
      'Yes. The mock interview uses AI to generate role-specific questions and provide feedback on your answers. (AI integration coming soon)',
  },
  {
    question: 'Can I download my resume?',
    answer:
      'Yes. You can download your resume as a professionally formatted PDF.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Your data is stored securely and never shared with third parties. We take privacy seriously and follow industry best practices.',
  },
];

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-neutral-900 text-center">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto mt-12">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-neutral-200">
              <button
                className="w-full flex items-center justify-between py-5 text-left focus:outline-none group"
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-neutral-900 font-medium pr-4 group-hover:text-primary-600 transition-colors">
                  {faq.question}
                </span>
                <ChevronIcon open={openIndex === index} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-40 opacity-100 pb-5' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-neutral-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
