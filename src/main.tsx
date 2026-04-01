import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerNotificationServiceWorker } from "@/notifications/registerServiceWorker";

registerNotificationServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
