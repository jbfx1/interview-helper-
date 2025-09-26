import { useState } from 'react';

const betaSources = ['AI Startups', 'Enterprise AI', 'Remote Friendly'];

const insights: Record<string, string> = {
  'AI Startups':
    'Track seed to Series B startups hiring founding engineers, with alerts when roles match your skills.',
  'Enterprise AI':
    'Follow transformation teams at Fortune 500 companies that are staffing AI centers of excellence.',
  'Remote Friendly': 'Discover remote-first companies offering location-agnostic compensation bands.'
};

function JobHunter() {
  const [source, setSource] = useState<string>(betaSources[0]);

  return (
    <div className="job-hunter">
      <h3>AI Job Hunter (Beta)</h3>
      <p>
        Activate curated job streams powered by proprietary labor market signals. The beta version
        surfaces opportunities before they hit public job boards.
      </p>
      <label>
        Signal Stream
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          {betaSources.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <p className="insight">{insights[source]}</p>
      <button type="button">Enable Stream</button>
    </div>
  );
}

export default JobHunter;
