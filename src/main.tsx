import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'webrtc-adapter';
createRoot(document.getElementById("root")!).render(<App />);
