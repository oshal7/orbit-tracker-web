import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const App = () => (
  <BrowserRouter basename={BASE}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Index />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
