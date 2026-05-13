/**
 * Shown after the SPA has fired `ready` but before any event has arrived
 * from native. In production this is rarely visible because the native host
 * keeps the SPA hidden until a screen calls `present()`.
 */
const IdleScreen = (): React.ReactElement => {
  return (
    <section className="screen idle">
      <div className="screen__center">
        <h1>Waiting for events…</h1>
        <p className="muted">
          The SPA has signaled <code>ready</code> and is listening for
          <code> standby</code>, <code>scan</code>, and <code>error</code>.
        </p>
      </div>
    </section>
  );
};

export default IdleScreen;
