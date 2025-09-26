import { useState } from 'react';

const sections = ['Summary', 'Experience', 'Skills'];

const guidance: Record<string, string> = {
  Summary: 'Craft a 2-3 sentence overview that highlights mission, impact, and focus areas.',
  Experience:
    'List your top achievements. Attach metrics, tools, and leadership moments the AI can expand into bullet points.',
  Skills: 'Group skills by craft, leadership, and tools. The builder will auto-score completeness.'
};

function ResumeBuilder() {
  const [activeSection, setActiveSection] = useState<string>(sections[0]);
  const [notes, setNotes] = useState<Record<string, string>>({ Summary: '', Experience: '', Skills: '' });

  return (
    <div className="resume-builder">
      <h3>AI Resume Builder</h3>
      <p>
        Capture the essentials before exporting a polished resume. Interview Pass AI auto-formats the
        final document across PDF and ATS-friendly versions.
      </p>
      <div className="tabs">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            className={section === activeSection ? 'active' : ''}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>
      <div className="builder-panel">
        <p className="guidance">{guidance[activeSection]}</p>
        <textarea
          aria-label={`${activeSection} notes`}
          placeholder={`Capture ${activeSection.toLowerCase()} highlights here...`}
          value={notes[activeSection] ?? ''}
          onChange={(event) =>
            setNotes((current) => ({
              ...current,
              [activeSection]: event.target.value
            }))
          }
        />
      </div>
      <button type="button" className="primary">
        Preview Resume Layout
      </button>
    </div>
  );
}

export default ResumeBuilder;
