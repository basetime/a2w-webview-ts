import { webAppSend, type StandbyPayload } from '../atw';

interface Props {
  payload: StandbyPayload | null;
}

/**
 * Default screen shown on the scanner home tab. Fires when the user is idle
 * and ready to scan a pass.
 */
const StandbyScreen = ({ payload }: Props): React.ReactElement => {
  return (
    <section className="screen standby">
      <div className="screen__center">
        <h1>Ready to scan</h1>
        <p className="muted">
          Scanner <code>{payload?.scanner ?? 'unknown'}</code>
        </p>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => webAppSend('navigate', { url: '/scan' })}
        >
          Open camera
        </button>
      </div>
    </section>
  );
};

export default StandbyScreen;
