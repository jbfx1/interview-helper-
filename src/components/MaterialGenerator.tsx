import { useMemo, useState } from 'react';

const templates = ['Resume Bullets', 'Cover Letter', 'Thank You Email'];

const prompts: Record<string, string> = {
  'Resume Bullets':
    'Summarize your impact using action verbs, metrics, and tools. Example: Increased conversion by 22% by leading a checkout redesign in React.',
  'Cover Letter':
    'Craft a narrative that links your passion with the company mission. Reference a recent product launch or business milestone.',
  'Thank You Email':
    'Reinforce fit, highlight a memorable moment from the interview, and clarify next steps in a concise message.'
};

function MaterialGenerator() {
  const [template, setTemplate] = useState<string>(templates[0]);

  const helperText = useMemo(() => prompts[template], [template]);

  return (
    <div className="material-generator">
      <h3>AI Material Generator</h3>
      <p>
        Select a template to get AI guidance on drafting job materials that resonate with hiring
        teams.
      </p>
      <label>
        Template
        <select value={template} onChange={(event) => setTemplate(event.target.value)}>
          {templates.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="helper-text">
        <p>{helperText}</p>
      </div>
    </div>
  );
}

export default MaterialGenerator;
