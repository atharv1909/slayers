import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/pages/DashboardLayout";
import Home from "@/pages/Home";
import Discovery from "@/pages/Discovery";
import Experiments from "@/pages/Experiments";
import Pathways from "@/pages/Pathways";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="discovery" element={<Discovery />} />
        <Route path="experiments" element={<Experiments />} />
        <Route path="pathways" element={<Pathways />} />
      </Route>
    </Routes>
  );
}

export default App;
