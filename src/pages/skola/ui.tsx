import { useState, type FormEvent, type ReactNode } from 'react';
import { BackendError, formatCode, normalizeCode, type Backend, type Session } from '../../backend';
import { IconBack, IconHome } from '../../components/Icons';
import { LogoMark } from '../../components/Logo';
import { Picture, type PicId } from '../../components/pictures';
import { Link, useRouter } from '../../lib/router';

export const AVATARS: PicId[] = ['katt', 'hund', 'räv', 'uggla', 'lejon', 'gris', 'mus', 'apa', 'elefant', 'zebra', 'fisk', 'anka', 'ko', 'val', 'igelkott', 'orm', 'sol', 'stjärna', 'blomma', 'jordgubbe', 'äpple', 'boll', 'bil', 'båt'];

export function Avatar({ id, size = 56 }: { id: PicId; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <Picture id={id} />
    </span>
  );
}

export function PortalShell({
  title,
  kicker,
  back,
  children,
  actions,
  session,
  backend,
}: {
  title: string;
  kicker?: string;
  back?: string;
  children: ReactNode;
  actions?: ReactNode;
  session?: Session | null;
  backend?: Backend | null;
}) {
  const { navigate } = useRouter();
  return (
    <div className="page portal container">
      <header className="portal-top">
        <button className="icon-btn" onClick={() => navigate(back ?? '/')} aria-label={back ? 'Tillbaka' : 'Till startsidan'}>
          {back ? <IconBack /> : <IconHome />}
        </button>
        <div className="portal-title">
          {kicker && <p className="hero-kicker">{kicker}</p>}
          <h1>{title}</h1>
        </div>
        <div className="portal-actions">
          {actions}
          {session && backend && session.role !== 'student' && (
            <button className="btn btn-soft" onClick={() => backend.signOut().then(() => navigate('/skola'))}>
              Logga ut
            </button>
          )}
        </div>
      </header>
      {backend?.mode === 'demo' && <DemoBanner />}
      {children}
    </div>
  );
}

export function DemoBanner() {
  return (
    <p className="demo-banner" role="note">
      <b>Demoläge.</b> Inget är kopplat till en server ännu – allt sparas bara i den här webbläsaren. Bra för att prova lärare, elev och förälder på samma enhet.
    </p>
  );
}

export function Loading({ label = 'Hämtar …' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice notice-error" role="alert">
      <b>Det gick inte.</b>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-soft" onClick={onRetry}>
          Försök igen
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty card">
      <LogoMark size={64} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function errorText(e: unknown) {
  return e instanceof BackendError ? e.message : 'Något gick fel. Försök igen.';
}

/** Inloggning och registrering för lärare och föräldrar. */
export function AuthForm({ role, backend }: { role: 'teacher' | 'parent'; backend: Backend }) {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'good'; text: string } | null>(null);
  const who = role === 'teacher' ? 'lärare' : 'förälder';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'in') await backend.signIn(email, pw);
      else if (mode === 'up') await backend.signUp(role, name, email, pw);
      else {
        await backend.resetPassword(email);
        setMsg({ kind: 'good', text: 'Om kontot finns har vi skickat ett mejl med en länk för att välja nytt lösenord.' });
      }
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={submit} noValidate>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => setMode('in')}>
          Logga in
        </button>
        <button type="button" role="tab" aria-selected={mode === 'up'} onClick={() => setMode('up')}>
          Skapa konto
        </button>
      </div>
      <h2>{mode === 'in' ? `Logga in som ${who}` : mode === 'up' ? `Nytt konto för ${who}` : 'Glömt lösenordet?'}</h2>
      {mode === 'up' && (
        <label className="field">
          <span>Ditt namn</span>
          <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
      )}
      <label className="field">
        <span>E-post</span>
        <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" required />
      </label>
      {mode !== 'reset' && (
        <label className="field">
          <span>Lösenord {mode === 'up' && <small>(minst 8 tecken)</small>}</span>
          <input id="auth-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required />
        </label>
      )}
      {mode === 'up' && (
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            Jag har läst <Link to="/hjalp">hur Leklandet hanterar uppgifter</Link>. Leklandet sparar mitt namn och min e-post för inloggningen.
          </span>
        </label>
      )}
      {msg && <p className={msg.kind === 'error' ? 'form-error' : 'form-good'} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      <button className="btn btn-big" type="submit" disabled={busy || !email || (mode !== 'reset' && !pw) || (mode === 'up' && (!name.trim() || !consent))}>
        {busy ? 'Vänta …' : mode === 'in' ? 'Logga in' : mode === 'up' ? 'Skapa konto' : 'Skicka länk'}
      </button>
      {mode === 'in' && backend.mode === 'firebase' && (
        <button type="button" className="link-btn" onClick={() => setMode('reset')}>
          Glömt lösenordet?
        </button>
      )}
      {mode === 'reset' && (
        <button type="button" className="link-btn" onClick={() => setMode('in')}>
          Tillbaka till inloggningen
        </button>
      )}
    </form>
  );
}

/** Stor kodruta för elevkod och föräldrakod. */
export function CodeForm({ label, button, onSubmit, initial = '' }: { label: string; button: string; onSubmit: (code: string) => Promise<void>; initial?: string }) {
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = normalizeCode(code);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(clean);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="code-form" onSubmit={submit}>
      <label className="field">
        <span>{label}</span>
        <input
          id="code-input"
          className="code-input"
          value={clean.length === 6 ? formatCode(clean) : code.toUpperCase()}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABC-123"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={9}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-big" type="submit" disabled={busy || clean.length !== 6}>
        {busy ? 'Vänta …' : button}
      </button>
    </form>
  );
}

export function formatDue(due?: string) {
  if (!due) return null;
  const d = new Date(due + 'T12:00:00');
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  const date = d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  if (days < 0) return { text: `Skulle vara klart ${date}`, late: true };
  if (days === 0) return { text: 'Ska vara klart idag', late: false };
  if (days === 1) return { text: 'Ska vara klart imorgon', late: false };
  return { text: `Klart senast ${date}`, late: false };
}
