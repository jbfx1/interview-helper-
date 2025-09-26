import { useState } from 'react';

type Tone = 'Concise' | 'Enthusiastic' | 'Data-driven';

type Channel = 'Email' | 'Phone Screen' | 'Panel Interview';

const samplePrompts: Record<Tone, Record<Channel, string>> = {
  Concise: {
    Email: 'Summarize my experience leading cross-functional teams in three bullet points.',
    'Phone Screen': 'Give me a crisp elevator pitch for a senior product manager phone screen.',
    'Panel Interview': 'Provide three concise talking points for a cross-team collaboration story.'
  },
  Enthusiastic: {
    Email: 'Draft a follow-up email that reinforces my excitement about the role and team.',
    'Phone Screen': 'Create an enthusiastic self-introduction for a fast-paced startup.',
    'Panel Interview': 'Brainstorm ways to show energy without overpowering a panel conversation.'
  },
  'Data-driven': {
    Email: 'Write a metrics-focused recap of my last project launch.',
    'Phone Screen': 'Prepare a quantified answer about roadmap impact for a product phone screen.',
    'Panel Interview': 'Outline data points to support my leadership principles in a panel.'
  }
};

function Playground() {
  const [tone, setTone] = useState<Tone>('Concise');
  const [channel, setChannel] = useState<Channel>('Email');
  const [prompt, setPrompt] = useState<string>(samplePrompts['Concise'].Email);
  const [notes, setNotes] = useState<string>('');

  const handleToneChange = (value: Tone) => {
    setTone(value);
    const suggestion = samplePrompts[value][channel];
    setPrompt(suggestion);
  };

  const handleChannelChange = (value: Channel) => {
    setChannel(value);
    const suggestion = samplePrompts[tone][value];
    setPrompt(suggestion);
  };

  return (
    <div className="playground">
      <div className="controls">
        <label>
          Tone
          <select value={tone} onChange={(event) => handleToneChange(event.target.value as Tone)}>
            {(Object.keys(samplePrompts) as Tone[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scenario
          <select
            value={channel}
            onChange={(event) => handleChannelChange(event.target.value as Channel)}
          >
            {(Object.keys(samplePrompts[tone]) as Channel[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="workspace">
        <div className="prompt-panel">
          <h3>Prompt Suggestion</h3>
          <textarea
            aria-label="Prompt suggestion"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </div>
        <div className="note-panel">
          <h3>Practice Notes</h3>
          <textarea
            aria-label="Practice notes"
            placeholder="Capture takeaways, improvements, or alternative answers."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default Playground;
