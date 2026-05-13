/**
 * Shown when the SPA is opened outside the scanner WebView (for example
 * in a regular browser tab during local development). The SDK needs
 * `window.atw` / `window.ReactNativeWebView` to be injected by the
 * native host before it can dispatch events, so there is nothing
 * useful for the app to do here besides explaining why.
 */
const NotEmbeddedScreen = (): React.ReactElement => {
  return (
    <main className="app">
      <div className="app__screen">
        <section className="screen">
          <div className="screen__center">
            <h1>Open in the scanner</h1>
            <p className="muted">
              This page must be loaded inside the Addtowallet scanner
              WebView.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default NotEmbeddedScreen;
