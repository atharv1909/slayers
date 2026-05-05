import { useState } from "react";
import { motion } from "framer-motion";
import { Beaker, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Save, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Experiment {
  id: string; candidate_name: string; predicted_yield: number; actual_yield: number;
  selectivity_measured: number; stability_measured: number;
  temperature: number; pressure: number; notes: string; date: string;
}

const mockExperiments: Experiment[] = [
  { id: "1", candidate_name: "Pt/TiO2-0", predicted_yield: 78.5, actual_yield: 34.2, selectivity_measured: 65.3, stability_measured: 245, temperature: 250, pressure: 20, notes: "Significant deactivation observed after 48h. Possible sulfur poisoning.", date: "2026-04-28" },
  { id: "2", candidate_name: "Pd/Al2O3-1", predicted_yield: 72.1, actual_yield: 68.9, selectivity_measured: 82.1, stability_measured: 512, temperature: 220, pressure: 15, notes: "Good agreement with prediction. Stable performance.", date: "2026-04-27" },
  { id: "3", candidate_name: "Ni/SiO2-2", predicted_yield: 65.4, actual_yield: 42.1, selectivity_measured: 58.7, stability_measured: 189, temperature: 240, pressure: 25, notes: "Coking observed. Need regeneration study.", date: "2026-04-26" },
  { id: "4", candidate_name: "Co/CeO2-3", predicted_yield: 58.2, actual_yield: 61.5, selectivity_measured: 71.2, stability_measured: 398, temperature: 230, pressure: 18, notes: "Better than predicted. Promising candidate for scale-up.", date: "2026-04-25" },
];

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);
  const [isRetraining, setIsRetraining] = useState(false);
  const [showRetrainSuccess, setShowRetrainSuccess] = useState(false);
  const [formData, setFormData] = useState({ candidate_name: "Pt/TiO2-0", actual_yield: "", selectivity_measured: "", stability_measured: "", temperature: "250", pressure: "20", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExperiment: Experiment = {
      id: Date.now().toString(), candidate_name: formData.candidate_name,
      predicted_yield: 78.5, actual_yield: parseFloat(formData.actual_yield) || 0,
      selectivity_measured: parseFloat(formData.selectivity_measured) || 0,
      stability_measured: parseFloat(formData.stability_measured) || 0,
      temperature: parseInt(formData.temperature) || 250, pressure: parseInt(formData.pressure) || 20,
      notes: formData.notes, date: new Date().toISOString().split("T")[0],
    };
    setExperiments([newExperiment, ...experiments]);
    setFormData({ candidate_name: "Pt/TiO2-0", actual_yield: "", selectivity_measured: "", stability_measured: "", temperature: "250", pressure: "20", notes: "" });
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsRetraining(false);
    setShowRetrainSuccess(true);
    setTimeout(() => setShowRetrainSuccess(false), 5000);
  };

  const getDiscrepancy = (pred: number, actual: number) => {
    const gap = Math.abs(pred - actual);
    const pct = (gap / pred) * 100;
    return { gap, pct, isHigh: pct > 20 };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Experiment Logger</h1>
          <p className="text-sm text-slate-400 mt-1">Log results, compare predictions, and retrain models</p>
        </div>
        <Button className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold" onClick={handleRetrain} disabled={isRetraining}>
          <RefreshCw className={`w-4 h-4 ${isRetraining ? "animate-spin" : ""}`} />
          {isRetraining ? "Retraining..." : "Retrain Model"}
        </Button>
      </div>

      {showRetrainSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-400">Model Retrained Successfully</p>
            <p className="text-xs text-slate-400">Average 8.3% accuracy improvement across all candidates.</p>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log" className="gap-2"><Beaker className="w-4 h-4" />Log Experiment</TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2"><TrendingUp className="w-4 h-4" />Prediction vs Reality</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">New Experiment</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Candidate</label>
                    <select value={formData.candidate_name} onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                      className="w-full h-10 rounded-md border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option>Pt/TiO2-0</option><option>Pd/Al2O3-1</option><option>Ni/SiO2-2</option><option>Co/CeO2-3</option><option>Cu/ZSM-5-4</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-400 mb-1 block">Actual Yield (%)</label><Input type="number" step="0.1" placeholder="e.g. 34.2" value={formData.actual_yield} onChange={(e) => setFormData({ ...formData, actual_yield: e.target.value })} /></div>
                    <div><label className="text-xs text-slate-400 mb-1 block">Selectivity (%)</label><Input type="number" step="0.1" placeholder="e.g. 65.3" value={formData.selectivity_measured} onChange={(e) => setFormData({ ...formData, selectivity_measured: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-400 mb-1 block">Stability (h)</label><Input type="number" placeholder="e.g. 245" value={formData.stability_measured} onChange={(e) => setFormData({ ...formData, stability_measured: e.target.value })} /></div>
                    <div><label className="text-xs text-slate-400 mb-1 block">Temperature (°C)</label><Input type="number" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value })} /></div>
                  </div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Pressure (bar)</label><Input type="number" value={formData.pressure} onChange={(e) => setFormData({ ...formData, pressure: e.target.value })} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Notes</label><Textarea placeholder="Observations, anomalies, recommendations..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
                  <Button type="submit" className="w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold"><Save className="w-4 h-4" />Save Experiment</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Experiment History ({experiments.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {experiments.map((exp) => {
                  const disc = getDiscrepancy(exp.predicted_yield, exp.actual_yield);
                  return (
                    <motion.div key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-100">{exp.candidate_name}</h4>
                        <div className="flex items-center gap-2">
                          {disc.isHigh && <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="w-3 h-3" />{disc.pct.toFixed(0)}% gap</Badge>}
                          <span className="text-[10px] text-slate-500">{exp.date}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-slate-800/50 rounded p-2 text-center"><p className="text-[9px] text-slate-500">Predicted</p><p className="text-sm font-semibold text-cyan-400">{exp.predicted_yield}%</p></div>
                        <div className="bg-slate-800/50 rounded p-2 text-center"><p className="text-[9px] text-slate-500">Actual</p><p className={`text-sm font-semibold ${exp.actual_yield < exp.predicted_yield * 0.8 ? "text-red-400" : "text-emerald-400"}`}>{exp.actual_yield}%</p></div>
                        <div className="bg-slate-800/50 rounded p-2 text-center"><p className="text-[9px] text-slate-500">Gap</p><p className={`text-sm font-semibold ${disc.isHigh ? "text-amber-400" : "text-slate-300"}`}>{disc.gap.toFixed(1)}%</p></div>
                      </div>
                      <div className="flex gap-3 text-[10px] text-slate-400">
                        <span>Sel: {exp.selectivity_measured}%</span><span>Stab: {exp.stability_measured}h</span><span>{exp.temperature}°C, {exp.pressure}bar</span>
                      </div>
                      {exp.notes && <p className="text-[11px] text-slate-500 mt-2 italic">"{exp.notes}"</p>}
                      {disc.isHigh && (
                        <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
                          <p className="text-[10px] text-amber-400 font-medium">AI Hypothesis:</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {exp.predicted_yield - exp.actual_yield > 30 ? "Possible sulfur poisoning or metal sintering. Recommend TPO/TEM analysis." : "Minor deactivation pathway. Check for coking or active site blocking."}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Prediction vs Reality — All Experiments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.map((exp) => {
                  const disc = getDiscrepancy(exp.predicted_yield, exp.actual_yield);
                  const isUnderperforming = exp.actual_yield < exp.predicted_yield;
                  return (
                    <div key={exp.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">{exp.candidate_name}</span>
                        <div className="flex items-center gap-2">
                          {isUnderperforming ? <TrendingDown className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />}
                          <Badge className={`text-[10px] ${disc.isHigh ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{disc.pct.toFixed(1)}% {isUnderperforming ? "under" : "over"}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-7 bg-slate-800/80 rounded-lg overflow-hidden border border-slate-700/50">
                          <div className="h-full bg-cyan-500/25 border-r-2 border-cyan-400 flex items-center px-2" style={{ width: `${Math.min(100, exp.predicted_yield)}%` }}>
                            <span className="text-[10px] text-cyan-300 font-medium">Predicted {exp.predicted_yield}%</span>
                          </div>
                        </div>
                        <div className="h-7 bg-slate-800/80 rounded-lg overflow-hidden border border-slate-700/50">
                          <div className={`h-full flex items-center px-2 ${isUnderperforming ? "bg-red-500/20 border-r-2 border-red-400" : "bg-emerald-500/20 border-r-2 border-emerald-400"}`} style={{ width: `${Math.min(100, exp.actual_yield)}%` }}>
                            <span className={`text-[10px] font-medium ${isUnderperforming ? "text-red-300" : "text-emerald-300"}`}>Actual {exp.actual_yield}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                <h4 className="text-sm font-medium text-slate-200 mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-cyan-400">{experiments.length}</p><p className="text-[10px] text-slate-500">Experiments</p></div>
                  <div><p className="text-2xl font-bold text-amber-400">{experiments.filter((e) => getDiscrepancy(e.predicted_yield, e.actual_yield).isHigh).length}</p><p className="text-[10px] text-slate-500">Flagged</p></div>
                  <div><p className="text-2xl font-bold text-emerald-400">{(experiments.reduce((acc, e) => acc + Math.abs(e.predicted_yield - e.actual_yield), 0) / experiments.length).toFixed(1)}%</p><p className="text-[10px] text-slate-500">Avg Error</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
