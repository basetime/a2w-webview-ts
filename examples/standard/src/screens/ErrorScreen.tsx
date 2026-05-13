import type { ErrorPayload } from '@basetime/a2w-scanner-ts';
import { webApp } from '../atw';

interface Props {
  payload: ErrorPayload | null;
}

/**
 * Page body for `/error/`. Native loads this URL when fetching a pass
 * fails. The payload always includes a human message and an HTTP-style
 * code (or `-1`).
 */
const ErrorScreen = ({ payload }: Props): React.ReactElement => {
  return (
    <section className="screen error">
      <div className="screen__center">
        <h1>Something went wrong</h1>
        <p className="error__code">Code {payload?.errorCode ?? -1}</p>
        {payload?.errorMessage && (
          <p className="error__message">{payload.errorMessage}</p>
        )}
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => webApp.send('navigate', { url: '/' })}
        >
          Back to standby
        </button>
      </div>
    </section>
  );
};

export default ErrorScreen;
