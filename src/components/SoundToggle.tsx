import { useSettings } from '../lib/storage';
import { play } from '../lib/sound';
import { IconSoundOff, IconSoundOn } from './Icons';

export function SoundToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [settings, set] = useSettings();
  const label = settings.sound ? 'Ljud på' : 'Ljud av';
  return (
    <button
      className={withLabel ? 'btn btn-soft' : 'icon-btn'}
      aria-pressed={settings.sound}
      aria-label={withLabel ? undefined : settings.sound ? 'Stäng av ljud' : 'Sätt på ljud'}
      onClick={() => {
        set({ sound: !settings.sound });
        if (!settings.sound) setTimeout(() => play('pop'), 30);
      }}
    >
      {settings.sound ? <IconSoundOn /> : <IconSoundOff />}
      {withLabel && label}
    </button>
  );
}
