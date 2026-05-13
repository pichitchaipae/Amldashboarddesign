import { createRoot } from "react-dom/client";
import App from "./app/App";
import { LangSkin } from "./app/components/aml-language";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <LangSkin />
    <App />
  </>
);
