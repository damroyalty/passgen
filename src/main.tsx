import React from "react";
import ReactDOM from "react-dom/client";
import App from "./passall";
import "./index.css";
import { enableDarkMode }  from './theme'

enableDarkMode();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
