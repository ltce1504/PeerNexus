import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import "./overrides.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("PeerNexus UI failed to render:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <div className="fatal-error-card">
            <span className="fatal-error-mark">!</span>
            <p className="eyebrow">PEERNEXUS RECOVERY</p>
            <h1>This screen ran into a problem.</h1>
            <p>Your browser data is safe. Reload the workspace to try again.</p>
            <button className="button button-primary" onClick={() => window.location.reload()}>Reload workspace</button>
            <details><summary>Technical details</summary><pre>{String(this.state.error.message)}</pre></details>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
