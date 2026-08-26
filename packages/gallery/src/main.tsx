import React from "react";
import ReactDOM from "react-dom/client";
import "@latent/theme/theme.css";
import "./gallery.css";
import { Gallery } from "./Gallery";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>
);
