import { webApp, type StandbyPayload } from '../atw';

interface Props {
  payload: StandbyPayload | null;
}

/**
 * Page body for `/standby/`. Native loads this URL when the scanner is on
 * its home / standby screen and immediately dispatches the `standby`
 * event into the webview.
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
          onClick={() => webApp.send('navigate', { url: '/scan' })}
        >
          Open camera
        </button>
      </div>
    </section>
  );
};

export default StandbyScreen;
