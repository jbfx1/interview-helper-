function StealthMode() {
  return (
    <div className="stealth-mode">
      <h3>Stealth Mode Desktop App</h3>
      <ol>
        <li>Install Node.js 18+ on your Windows laptop.</li>
        <li>
          Clone or download this repository, then run <code>npm install</code> followed by
          <code>npm run electron</code> to package the desktop build.
        </li>
        <li>
          Launch Interview Pass AI as a native window that docks beside your video calls while
          remaining hidden from screen shares.
        </li>
        <li>
          Enable whisper prompts, keyboard shortcuts, and offline fallback models for private
          sessions.
        </li>
      </ol>
      <p>
        The desktop experience mirrors the web UI and adds microphone controls, floating widgets, and
        subtle notifications that only you can see.
      </p>
    </div>
  );
}

export default StealthMode;
