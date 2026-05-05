import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface MoleculeViewerProps {
  candidate: {
    name: string;
    smiles: string;
    predicted_activity?: number;
    predicted_selectivity?: number;
    predicted_stability?: number;
    metal_type?: string;
    support_material?: string;
  };
  onClose: () => void;
}

export function MoleculeViewer({ candidate, onClose }: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let viewer: any = null;
    const initViewer = async () => {
      try {
        const $3Dmol = await import("3dmol");
        if (containerRef.current && $3Dmol.default) {
          const element = containerRef.current;
          element.innerHTML = "";
          const config = { backgroundColor: "#020617" };
          viewer = $3Dmol.default.createViewer(element, config);
          if (candidate.smiles) {
            viewer.addModel(candidate.smiles, "smi");
            viewer.setStyle({}, { stick: { colorscheme: "cyanCarbon", radius: 0.15 }, sphere: { scale: 0.3 } });
            viewer.zoomTo();
            viewer.render();
          }
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    initViewer();
    return () => {
      if (viewer) {
        try { viewer.removeAllModels(); viewer.clear(); } catch { /* ok */ }
      }
    };
  }, [candidate.smiles]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{candidate.name}</h2>
            <p className="text-xs font-mono text-slate-500">{candidate.smiles}</p>
          </div>
          <div className="flex items-center gap-3">
            {candidate.metal_type && <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">{candidate.metal_type}</span>}
            {candidate.support_material && <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs">{candidate.support_material}</span>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-slate-950">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm text-slate-400">Loading 3D structure...</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" style={{ position: "relative" }} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400"><ZoomIn className="w-4 h-4" /></button>
              <button className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400"><ZoomOut className="w-4 h-4" /></button>
              <button className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400"><RotateCw className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="w-64 border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-slate-300">Predicted Properties</h3>
            <div className="space-y-3">
              {[
                { label: "Activity", value: candidate.predicted_activity?.toFixed(2), unit: "mol/g/s", color: "cyan", pct: (candidate.predicted_activity || 0) * 100 },
                { label: "Selectivity", value: `${candidate.predicted_selectivity?.toFixed(1)}%`, unit: "", color: "violet", pct: candidate.predicted_selectivity || 0 },
                { label: "Stability", value: candidate.predicted_stability?.toFixed(0), unit: "h", color: "emerald", pct: Math.min(100, ((candidate.predicted_stability || 0) / 1000) * 100) },
              ].map((prop) => (
                <div key={prop.label} className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase">{prop.label}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className={`text-2xl font-bold text-${prop.color}-400`}>{prop.value || "N/A"}</span>
                    {prop.unit && <span className="text-[10px] text-slate-500 mb-1">{prop.unit}</span>}
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2">
                    <div className={`h-full bg-${prop.color}-500 rounded-full`} style={{ width: `${prop.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
