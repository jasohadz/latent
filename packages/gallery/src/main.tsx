import React from "react";
import ReactDOM from "react-dom/client";
// fonts.css first: its @imports must lead the bundled CSS or browsers drop them.
import "@latent/theme/fonts.css";
import "@latent/theme/theme.css";
import "./gallery.css";
import { Gallery } from "./Gallery";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>
);
