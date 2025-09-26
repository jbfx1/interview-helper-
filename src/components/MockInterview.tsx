import { useMemo, useState } from 'react';

type FocusArea = 'Product Sense' | 'System Design' | 'Behavioral';

type Difficulty = 'Warm-up' | 'Standard' | 'Stretch';

const prompts: Record<FocusArea, Record<Difficulty, string>> = {
  'Product Sense': {
    'Warm-up': 'Design a simple notes app for remote teams. What metrics matter?',
    Standard: 'Improve retention for a subscription meditation app. Prioritize your roadmap.',
    Stretch: 'Define a north star metric and GTM strategy for a new AI productivity companion.'
  },
  'System Design': {
    'Warm-up': 'Sketch the architecture for a URL shortener with analytics.',
    Standard: 'Design a scalable notification service for Interview Pass AI.',
    Stretch: 'Create a low-latency voice transcription service for live coaching insights.'
  },
  Behavioral: {
    'Warm-up': 'Describe a time you aligned stakeholders with competing priorities.',
    Standard: 'Tell me about a time you navigated a difficult team conflict.',
    Stretch: 'Share an example of influencing senior leadership without direct authority.'
  }
};

function MockInterview() {
  const [focus, setFocus] = useState<FocusArea>('Product Sense');
  const [difficulty, setDifficulty] = useState<Difficulty>('Standard');

  const prompt = useMemo(() => prompts[focus][difficulty], [focus, difficulty]);

  return (
    <div className="mock-interview" id="mock-interview">
      <h3>Mock Interview</h3>
      <p>
        Generate scenario-based practice sessions. Pair with the Interview Copilot for real-time
        scoring and feedback.
      </p>
      <div className="controls">
        <label>
          Focus Area
          <select value={focus} onChange={(event) => setFocus(event.target.value as FocusArea)}>
            {(Object.keys(prompts) as FocusArea[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            {(Object.keys(prompts[focus]) as Difficulty[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="prompt-panel">
        <h4>Prompt</h4>
        <p>{prompt}</p>
      </div>
    </div>
  );
}

export default MockInterview;
