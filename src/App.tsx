import type { JSX } from 'react';
import SupportForm from './components/SupportForm';
import './app.css';

function App(): JSX.Element {
  return (
    <main className="app">
      <header className="app__header">
        <h1>Need a hand before your next interview?</h1>
        <p>Tell us what you are working on and our coaches will get back to you shortly.</p>
      </header>
      <SupportForm />
    </main>
  );
}

export default App;
