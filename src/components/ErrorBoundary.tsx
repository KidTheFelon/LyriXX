import { Component } from "react";
import { logger } from "@/services/logger";
import { getTranslation, type Lang } from "@/i18n";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  lang: Lang;
}

/** React error boundary с fallback UI и кнопкой retry. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, lang: "ru" };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("ErrorBoundary", "", error, info.componentStack);
  }

  componentDidMount() {
    this.updateLang();
    this._observer = new MutationObserver(() => this.updateLang());
    this._observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  componentWillUnmount() {
    this._observer?.disconnect();
  }

  private _observer: MutationObserver | null = null;

  private updateLang() {
    const lang: Lang = document.documentElement.lang === "en" ? "en" : "ru";
    if (lang !== this.state.lang) {
      this.setState({ lang });
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="editor-empty">
          <div className="editor-empty-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="editor-empty-text">{getTranslation(this.state.lang, "errSomethingWrong")}</p>
          <button
            className="modal-btn modal-btn-confirm"
            style={{ marginTop: 12 }}
            onClick={() => this.setState({ error: null })}
            type="button"
          >
            {getTranslation(this.state.lang, "tryAgain")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
