import { useState } from 'react';

const careerGoals = ['Promotion Readiness', 'Career Pivot', 'Leadership Growth'];

const advice: Record<string, string[]> = {
  'Promotion Readiness': [
    'Highlight measurable wins from the last two quarters.',
    'Align your growth plan with your manager’s success metrics.',
    'Collect peer feedback to demonstrate cross-functional impact.'
  ],
  'Career Pivot': [
    'Map transferable skills and identify gaps the AI can help close.',
    'Leverage the Interview Question Bank to practice new domain questions.',
    'Use the Material Generator to translate past experience into new language.'
  ],
  'Leadership Growth': [
    'Document stories showing vision-setting and team development.',
    'Schedule weekly mock panels to sharpen executive presence.',
    'Adopt Interview Copilot cues for coaching in real meetings.'
  ]
};

function CareerCoach() {
  const [goal, setGoal] = useState<string>(careerGoals[0]);

  return (
    <div className="career-coach">
      <h3>AI Career Coach</h3>
      <p>
        Choose a focus area to see how Interview Pass AI guides your next move with targeted
        recommendations.
      </p>
      <label>
        Goal
        <select value={goal} onChange={(event) => setGoal(event.target.value)}>
          {careerGoals.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <ul>
        {advice[goal].map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

export default CareerCoach;
