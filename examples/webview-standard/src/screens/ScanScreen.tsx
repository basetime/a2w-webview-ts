import type { ScanPayload } from '@basetime/a2w-scanner-ts';
import { webApp } from '../atw';

interface Props {
  payload: ScanPayload | null;
}

/**
 * Page body for `/scan/`. Native loads this URL after a pass has been
 * fetched and dispatches the `scan` event. The SDK normalizes `found` to
 * a boolean; the legacy native bridge still emits a string, so coerce
 * defensively.
 */
const ScanScreen = ({ payload }: Props): React.ReactElement => {
  const pass = payload?.pass ?? null;
  const found = !!payload?.found;

  return (
    <section className={`screen scan ${found ? 'scan--found' : 'scan--missing'}`}>
      <div className="screen__center">
        <h1>{found ? 'Verified!' : 'Not found'}</h1>
        {pass?.isScanned && <p className="muted">(Already scanned.)</p>}
        {pass && (
          <dl className="kv">
            <dt>Pass ID</dt>
            <dd>{pass.id}</dd>
            {pass.primaryKey && (
              <>
                <dt>Primary key</dt>
                <dd>{pass.primaryKey}</dd>
              </>
            )}
            {pass.campaignId && (
              <>
                <dt>Campaign</dt>
                <dd>{pass.campaignId}</dd>
              </>
            )}
          </dl>
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

export default ScanScreen;
