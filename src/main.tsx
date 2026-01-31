import React from "react";
import ReactDOM from "react-dom/client";
import { DeckelScreen } from "./app/DeckelScreen";
import "./index.css"; // falls Tailwind / Styles

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DeckelScreen />
  </React.StrictMode>
);
