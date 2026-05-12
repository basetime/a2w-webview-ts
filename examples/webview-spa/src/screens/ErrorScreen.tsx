import { webAppSend, type ErrorPayload } from '../atw';

interface Props {
  payload: ErrorPayload | null;
}

/**
 * Shown by the native `ErrorPage` component when fetching a pass fails. The
 * payload always includes a human message and an HTTP-style code (or `-1`).
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
          onClick={() => webAppSend('navigate', { url: '/scan' })}
        >
          Try again
        </button>
      </div>
    </section>
  );
};

export default ErrorScreen;
