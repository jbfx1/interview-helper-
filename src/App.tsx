import { useMemo, useState } from 'react';
import FeatureSection from './components/FeatureSection';
import SalaryCalculator from './components/SalaryCalculator';
import Playground from './components/Playground';
import MockInterview from './components/MockInterview';
import PreparationHub from './components/PreparationHub';
import RecruiterPanel from './components/RecruiterPanel';
import CareerCoach from './components/CareerCoach';
import MaterialGenerator from './components/MaterialGenerator';
import JobHunter from './components/JobHunter';
import ResumeBuilder from './components/ResumeBuilder';
import StealthMode from './components/StealthMode';
import Copilot from './components/Copilot';
import { questionCategories } from './data/questions';

const featureHighlights = [
  {
    title: 'Get Started Guide',
    description:
      'Step-by-step walkthrough that shows new users how to connect their calendar, import resumes, and tailor the Interview Copilot to their goals.',
    cta: 'Open Guide',
    anchor: 'get-started'
  },
  {
    title: 'Interview Question Bank',
    description:
      'Curated prompts by role, seniority, and company type. Includes AI-generated follow-up questions to keep you sharp.',
    cta: 'Browse Questions',
    anchor: 'question-bank'
  },
  {
    title: 'Interview Copilot',
    description:
      'Live, on-device assistant that listens and suggests responses without tipping off interviewers.',
    cta: 'Launch Copilot',
    anchor: 'copilot'
  },
  {
    title: 'Mock Interview Studio',
    description:
      'Practice with AI panels, instant scoring, and structured feedback to close skill gaps.',
    cta: 'Start Practicing',
    anchor: 'mock-interview'
  }
];

function App() {
  const [activeAnchor, setActiveAnchor] = useState<string>('get-started');

  const navLinks = useMemo(
    () => [
      { label: 'Guide', href: '#get-started' },
      { label: 'Playground', href: '#playground' },
      { label: 'Question Bank', href: '#question-bank' },
      { label: 'Career', href: '#career' },
      { label: 'Preparation', href: '#preparation' },
      { label: 'Copilot', href: '#copilot' }
    ],
    []
  );

  return (
    <div className="app">
      <header className="hero">
        <nav className="top-nav">
          <span className="logo">Interview Pass AI</span>
          <div className="nav-links">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={activeAnchor === link.href.slice(1) ? 'active' : ''}
                onClick={() => setActiveAnchor(link.href.slice(1))}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
        <div className="hero-content">
          <p className="badge">AI-Powered Career Platform</p>
          <h1>
            Confidently conquer every interview with an AI teammate that works on the web and
            desktop.
          </h1>
          <p className="subtitle">
            Interview Pass AI unifies preparation, coaching, salary insights, and real-time support
            into a single experience you can open in the browser or run privately on your Windows
            laptop.
          </p>
          <div className="hero-actions">
            <a className="primary" href="#get-started">
              Explore Features
            </a>
            <a className="secondary" href="#stealth-mode">
              Download Desktop Guide
            </a>
          </div>
        </div>
        <div className="highlight-grid" id="get-started">
          {featureHighlights.map((feature) => (
            <FeatureSection key={feature.title} {...feature} />
          ))}
        </div>
      </header>

      <main>
        <section id="playground" className="section">
          <h2>Playground</h2>
          <p className="section-intro">
            Experiment with prompts, compare AI tools, and save your favorite practice scenarios for
            later. The playground syncs with the desktop Stealth Mode so you can rehearse privately
            before a live call.
          </p>
          <Playground />
        </section>

        <section id="question-bank" className="section">
          <h2>Interview Question Bank</h2>
          <p className="section-intro">
            Browse curated questions covering behavioral, technical, and leadership interviews.
            Every selection provides follow-up prompts to practice deep dives.
          </p>
          <div className="question-grid">
            {questionCategories.map((category) => (
              <div key={category.name} className="question-card">
                <h3>{category.name}</h3>
                <ul>
                  {category.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="career" className="section">
          <h2>Career Growth Toolkit</h2>
          <p className="section-intro">
            Navigate job offers, coaching, and recruiter outreach from a single dashboard.
          </p>
          <div className="two-column">
            <CareerCoach />
            <RecruiterPanel />
          </div>
          <div className="two-column">
            <JobHunter />
            <MaterialGenerator />
          </div>
          <SalaryCalculator />
        </section>

        <section id="preparation" className="section">
          <h2>Preparation Hub</h2>
          <p className="section-intro">
            Centralize your prep notes, mock interviews, and resume drafts. Switch between practice
            modes and gather instant insights.
          </p>
          <PreparationHub />
          <div className="two-column">
            <MockInterview />
            <ResumeBuilder />
          </div>
        </section>

        <section id="stealth-mode" className="section">
          <h2>Stealth Mode for Windows</h2>
          <p className="section-intro">
            Run Interview Pass AI locally as a discreet desktop app. It stays invisible during screen
            shares and integrates with your microphone for subtle prompts.
          </p>
          <StealthMode />
        </section>

        <section id="copilot" className="section">
          <h2>Interview Copilot</h2>
          <p className="section-intro">
            Keep the Copilot by your side in real interviews. Capture notes, surface tailored talking
            points, and receive live coaching without disrupting the conversation.
          </p>
          <Copilot />
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interview Pass AI. Built for confident candidates.</p>
        <a href="#get-started">Back to top</a>
      </footer>
    </div>
  );
}

export default App;
