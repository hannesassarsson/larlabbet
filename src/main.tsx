import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installAudioUnlock } from './lib/sound';
import { registerServiceWorker } from './lib/sw';
import './styles/global.css';
import './styles/app.css';
import './styles/school.css';
import './styles/print.css';

installAudioUnlock();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Dölj startskärmen när appen har ritats.
requestAnimationFrame(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('hide');
  setTimeout(() => splash.remove(), 400);
});
