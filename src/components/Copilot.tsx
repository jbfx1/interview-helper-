const copilotCapabilities = [
  {
    title: 'Real-time Nudges',
    description: 'Detects keywords and surfaces supporting stories, metrics, or follow-up questions.'
  },
  {
    title: 'Live Notetaker',
    description: 'Captures highlights and action items, syncing them back to the Preparation Hub.'
  },
  {
    title: 'Confidence Monitor',
    description: 'Tracks speaking pace and sentiment, then suggests adjustments in stealth mode.'
  }
];

function Copilot() {
  return (
    <div className="copilot">
      <h3>Interview Copilot</h3>
      <p>
        Keep the Copilot active during interviews for discreet coaching. Toggle between whisper mode
        on desktop and in-browser overlays.
      </p>
      <div className="capability-grid">
        {copilotCapabilities.map((item) => (
          <article key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Copilot;
