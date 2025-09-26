const preparationItems = [
  {
    title: 'Behavioral Mastery',
    description: 'Record answers, auto-transcribe them, and get AI feedback on clarity and structure.'
  },
  {
    title: 'Company Research',
    description: 'Clip insights from news, Glassdoor reviews, and company filings into one briefing.'
  },
  {
    title: 'Framework Library',
    description: 'Quickly reference STAR, AARM, and leadership principles while practicing.'
  }
];

function PreparationHub() {
  return (
    <div className="preparation-hub">
      <div className="hub-summary">
        <h3>Preparation Dashboard</h3>
        <p>
          Track progress across interviews, sync with calendar events, and prioritize practice using
          AI-generated impact scores. The hub pushes reminders to the desktop app so nothing slips
          through during crunch time.
        </p>
      </div>
      <div className="hub-items">
        {preparationItems.map((item) => (
          <article key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default PreparationHub;
