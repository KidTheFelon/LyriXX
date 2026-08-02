import React from "react";
import ReactDOM from "react-dom/client";
import { emit } from "@tauri-apps/api/event";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:2rem;color:#c00">Fatal: #root element not found in index.html</p>';
  throw new Error("Missing #root element");
}

const params = new URLSearchParams(window.location.search);
const songId = params.get("songId");

if (songId) {
  import("./components/SongWindow").then(({ SongWindow }) => {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <SongWindow songId={songId} />
      </React.StrictMode>,
    );
    emit("app-ready");
  });
} else {
  import("./App").then(({ default: App }) => {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    emit("app-ready");
  });
}
