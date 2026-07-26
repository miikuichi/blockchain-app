import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import process from "process";
import { Buffer } from "buffer";

import "./index.css";
import App from "./App.jsx";

if (typeof globalThis.global === "undefined") {
  globalThis.global = globalThis;
}

if (typeof globalThis.process === "undefined") {
  globalThis.process = process;
}

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
