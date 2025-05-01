// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* 只要這一層 HashRouter 就夠了 */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
