import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Atom, BarChart3, Box, Layers3 } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  smiles: string;
  type: string;
  predicted_activity: number;
  predicted_selectivity: number;
  predicted_stability: number;
  predicted_confidence: number;
  metal_type?: string;
  support_material?: string;
  metadata?: { rationale?: string };
  [key: string]: any;
}

interface ElementInfo {
  symbol: string;
  name: string;
  atomicNumber: number;
  radius: number;
  color: string;
  text: string;
  role: "metal" | "support" | "adsorbate";
}

interface BallAtom {
  id: string;
  element: ElementInfo;
  x: number;
  y: number;
  z: number;
}

const demoCandidates: Candidate[] = [
  { id: "demo-1", name: "Pt-Ru/TiO2-A1", smiles: "[Pt].[Ru].[TiO2]", type: "known", predicted_activity: 0.91, predicted_selectivity: 88.4, predicted_stability: 920, predicted_confidence: 0.94, metal_type: "Pt", support_material: "TiO2", metadata: { rationale: "High hydrogen activation and oxygen vacancy mobility for alcohol upgrading." } },
  { id: "demo-2", name: "Ni-Cu/CeO2-A2", smiles: "[Ni].[Cu].[CeO2]", type: "novel", predicted_activity: 0.84, predicted_selectivity: 91.2, predicted_stability: 760, predicted_confidence: 0.89, metal_type: "Ni", support_material: "CeO2", metadata: { rationale: "Balanced dehydrogenation and C-C coupling selectivity." } },
  { id: "demo-3", name: "Pd/ZSM-5-A3", smiles: "[Pd].[ZSM-5]", type: "known", predicted_activity: 0.78, predicted_selectivity: 82.9, predicted_stability: 1040, predicted_confidence: 0.86, metal_type: "Pd", support_material: "ZSM-5" },
  { id: "demo-4", name: "Co-Fe/Al2O3-A4", smiles: "[Co].[Fe].[Al2O3]", type: "novel", predicted_activity: 0.69, predicted_selectivity: 74.8, predicted_stability: 680, predicted_confidence: 0.81, metal_type: "Co", support_material: "Al2O3" },
  { id: "demo-5", name: "Rh/CeO2-A5", smiles: "[Rh].[CeO2]", type: "known", predicted_activity: 0.73, predicted_selectivity: 86.1, predicted_stability: 840, predicted_confidence: 0.84, metal_type: "Rh", support_material: "CeO2" },
  { id: "demo-6", name: "Cu-Zn/ZrO2-A6", smiles: "[Cu].[Zn].[ZrO2]", type: "novel", predicted_activity: 0.62, predicted_selectivity: 79.5, predicted_stability: 590, predicted_confidence: 0.78, metal_type: "Cu", support_material: "ZrO2" },
  { id: "demo-7", name: "Ir/Carbon-A7", smiles: "[Ir].[C]", type: "known", predicted_activity: 0.88, predicted_selectivity: 69.4, predicted_stability: 1120, predicted_confidence: 0.9, metal_type: "Ir", support_material: "Carbon" },
  { id: "demo-8", name: "Ag-Au/SiO2-A8", smiles: "[Ag].[Au].[SiO2]", type: "novel", predicted_activity: 0.57, predicted_selectivity: 93.3, predicted_stability: 520, predicted_confidence: 0.74, metal_type: "Ag", support_material: "SiO2" },
];

const colors = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  green: "#34d399",
  yellow: "#fbbf24",
  bg: "#020617",
  grid: "#263244",
};

const elements: Record<string, ElementInfo> = {
  H: { symbol: "H", name: "Hydrogen", atomicNumber: 1, radius: 24, color: "#f8fafc", text: "#0f172a", role: "adsorbate" },
  C: { symbol: "C", name: "Carbon", atomicNumber: 6, radius: 34, color: "#64748b", text: "#ffffff", role: "adsorbate" },
  O: { symbol: "O", name: "Oxygen", atomicNumber: 8, radius: 32, color: "#ef4444", text: "#ffffff", role: "adsorbate" },
  Al: { symbol: "Al", name: "Aluminium", atomicNumber: 13, radius: 42, color: "#94a3b8", text: "#0f172a", role: "support" },
  Si: { symbol: "Si", name: "Silicon", atomicNumber: 14, radius: 40, color: "#38bdf8", text: "#06202a", role: "support" },
  Ti: { symbol: "Ti", name: "Titanium", atomicNumber: 22, radius: 44, color: "#22d3ee", text: "#06202a", role: "support" },
  Fe: { symbol: "Fe", name: "Iron", atomicNumber: 26, radius: 48, color: "#dc2626", text: "#ffffff", role: "metal" },
  Co: { symbol: "Co", name: "Cobalt", atomicNumber: 27, radius: 48, color: "#3b82f6", text: "#ffffff", role: "metal" },
  Ni: { symbol: "Ni", name: "Nickel", atomicNumber: 28, radius: 48, color: "#22c55e", text: "#06202a", role: "metal" },
  Cu: { symbol: "Cu", name: "Copper", atomicNumber: 29, radius: 50, color: "#f97316", text: "#111827", role: "metal" },
  Zn: { symbol: "Zn", name: "Zinc", atomicNumber: 30, radius: 50, color: "#86efac", text: "#052e16", role: "metal" },
  Zr: { symbol: "Zr", name: "Zirconium", atomicNumber: 40, radius: 48, color: "#2dd4bf", text: "#042f2e", role: "support" },
  Ru: { symbol: "Ru", name: "Ruthenium", atomicNumber: 44, radius: 50, color: "#06b6d4", text: "#06202a", role: "metal" },
  Rh: { symbol: "Rh", name: "Rhodium", atomicNumber: 45, radius: 50, color: "#e879f9", text: "#3b0764", role: "metal" },
  Pd: { symbol: "Pd", name: "Palladium", atomicNumber: 46, radius: 52, color: "#c4b5fd", text: "#1e1b4b", role: "metal" },
  Ag: { symbol: "Ag", name: "Silver", atomicNumber: 47, radius: 52, color: "#e5e7eb", text: "#111827", role: "metal" },
  Ce: { symbol: "Ce", name: "Cerium", atomicNumber: 58, radius: 54, color: "#2dd4bf", text: "#042f2e", role: "support" },
  Ir: { symbol: "Ir", name: "Iridium", atomicNumber: 77, radius: 52, color: "#818cf8", text: "#111827", role: "metal" },
  Pt: { symbol: "Pt", name: "Platinum", atomicNumber: 78, radius: 54, color: "#d4d4d8", text: "#111827", role: "metal" },
  Au: { symbol: "Au", name: "Gold", atomicNumber: 79, radius: 54, color: "#facc15", text: "#422006", role: "metal" },
};

function score(candidate: Candidate) {
  return candidate.predicted_activity * 0.4 + (candidate.predicted_selectivity / 100) * 0.35 + (candidate.predicted_stability / 1200) * 0.25;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seedFrom(value: string) {
  return value.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 97);
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function element(symbol: string) {
  return elements[symbol] || { symbol, name: symbol, atomicNumber: 0, radius: 44, color: colors.cyan, text: "#020617", role: "metal" as const };
}

function supportElements(support?: string) {
  if (!support) return [element("Ti"), element("O")];
  if (support.includes("Ti")) return [element("Ti"), element("O")];
  if (support.includes("Ce")) return [element("Ce"), element("O")];
  if (support.includes("Zr")) return [element("Zr"), element("O")];
  if (support.includes("Al")) return [element("Al"), element("O")];
  if (support.includes("Si") || support.includes("ZSM")) return [element("Si"), element("O")];
  if (support.includes("Carbon")) return [element("C")];
  return [element("Ti"), element("O")];
}

function secondMetal(candidate: Candidate) {
  const match = candidate.name.match(/-([A-Z][a-z]?)/);
  return match?.[1] || ["Ru", "Cu", "Ni", "Pd", "Fe"][seedFrom(candidate.id) % 5];
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
        active
          ? "border-cyan-500/60 bg-slate-800 text-cyan-100"
          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatPill({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full" style={{ width: `${clamp(pct, 5, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function ScatterPanel({ data }: { data: Candidate[] }) {
  const width = 760;
  const height = 360;
  const left = 54;
  const right = 24;
  const top = 22;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (value: number) => left + clamp(value, 0, 1) * plotWidth;
  const y = (value: number) => top + (1 - clamp(value, 0, 100) / 100) * plotHeight;

  return (
    <motion.div key="scatter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[370px] w-full" role="img" aria-label="Catalyst activity and selectivity scatter plot">
          <rect x="0" y="0" width={width} height={height} fill={colors.bg} />
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={`y-${tick}`}>
              <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke={colors.grid} />
              <text x={left - 12} y={y(tick) + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{tick}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <text key={`x-${tick}`} x={x(tick)} y={height - 20} textAnchor="middle" fill="#94a3b8" fontSize="11">{tick.toFixed(2)}</text>
          ))}
          <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="#64748b" />
          <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="#64748b" />
          <text x={width / 2} y={height - 4} textAnchor="middle" fill="#94a3b8" fontSize="12">Activity</text>
          {data.map((candidate) => {
            const color = candidate.type === "known" ? colors.cyan : colors.violet;
            return <circle key={candidate.id} cx={x(candidate.predicted_activity)} cy={y(candidate.predicted_selectivity)} r="9" fill={color} opacity="0.92" />;
          })}
        </svg>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <StatPill label="Avg Activity" value={(data.reduce((s, c) => s + c.predicted_activity, 0) / data.length).toFixed(3)} color={colors.cyan} pct={(data.reduce((s, c) => s + c.predicted_activity, 0) / data.length) * 100} />
        <StatPill label="Avg Selectivity" value={`${(data.reduce((s, c) => s + c.predicted_selectivity, 0) / data.length).toFixed(1)}%`} color={colors.violet} pct={data.reduce((s, c) => s + c.predicted_selectivity, 0) / data.length} />
        <StatPill label="Avg Stability" value={`${(data.reduce((s, c) => s + c.predicted_stability, 0) / data.length).toFixed(0)}h`} color={colors.green} pct={(data.reduce((s, c) => s + c.predicted_stability, 0) / data.length / 1200) * 100} />
        <StatPill label="Avg Confidence" value={`${((data.reduce((s, c) => s + c.predicted_confidence, 0) / data.length) * 100).toFixed(0)}%`} color={colors.yellow} pct={(data.reduce((s, c) => s + c.predicted_confidence, 0) / data.length) * 100} />
      </div>
    </motion.div>
  );
}

function BarPanel({ data, onSelect }: { data: Candidate[]; onSelect: (id: string) => void }) {
  const top = data.slice(0, 6);
  const max = Math.max(...top.map(score));

  return (
    <motion.div key="bars" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-4">
          {top.map((candidate, index) => {
            const value = score(candidate);
            return (
              <div key={candidate.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{index + 1}. {candidate.name}</span>
                  <span className="text-slate-400">{value.toFixed(3)}</span>
                </div>
                <div className="h-7 rounded bg-slate-900">
                  <div className="h-full rounded bg-cyan-500" style={{ width: `${(value / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        {top.map((candidate, index) => (
          <button key={candidate.id} type="button" onClick={() => onSelect(candidate.id)} className="flex w-full items-center gap-3 rounded-md border border-slate-800 bg-slate-950 p-3 text-left transition hover:border-cyan-500/60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-cyan-300">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-100">{candidate.name}</span>
              <span className="block text-xs text-slate-500">Open molecule</span>
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function buildAtoms(candidate: Candidate) {
  const seed = seedFrom(`${candidate.id}-${candidate.name}-${candidate.smiles}`);
  const rand = seededRandom(seed);
  const primaryMetal = element(candidate.metal_type || candidate.name.split(/[/-]/)[0] || "Pt");
  const promoter = element(secondMetal(candidate));
  const support = supportElements(candidate.support_material);
  const atoms: BallAtom[] = [];

  atoms.push({ id: "m1", element: primaryMetal, x: -28, y: -22, z: 34 });
  atoms.push({ id: "m2", element: promoter, x: 38, y: 8, z: 16 });
  atoms.push({ id: "o1", element: element("O"), x: -96, y: 28, z: 4 });
  atoms.push({ id: "c1", element: element("C"), x: -38, y: -100, z: 10 });
  atoms.push({ id: "h1", element: element("H"), x: 44, y: -94, z: 28 });
  atoms.push({ id: "o2", element: element("O"), x: 112, y: -44, z: 6 });

  for (let i = 0; i < 7; i += 1) {
    atoms.push({
      id: `s${i}`,
      element: support[i % support.length],
      x: -180 + i * 60 + (rand() - 0.5) * 10,
      y: 132 + (i % 2) * 22,
      z: -18 + (i % 3) * 8,
    });
  }

  return atoms;
}

function MoleculeBall({ atom }: { atom: BallAtom }) {
  const size = atom.element.radius;
  const scale = 1 + atom.z / 240;

  return (
    <div
      className="absolute flex items-center justify-center rounded-full text-xs font-black"
      style={{
        left: `calc(50% + ${atom.x}px)`,
        top: `calc(50% + ${atom.y}px)`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `scale(${scale})`,
        background: atom.element.color,
        color: atom.element.text,
        border: "1px solid rgba(15, 23, 42, 0.55)",
        boxShadow: "inset -5px -6px 8px rgba(15,23,42,0.22)",
      }}
      title={`${atom.element.name} (Z=${atom.element.atomicNumber})`}
    >
      {atom.element.symbol}
    </div>
  );
}

function MoleculeView({ candidate }: { candidate: Candidate }) {
  const atoms = useMemo(() => buildAtoms(candidate), [candidate.id, candidate.name, candidate.smiles]);
  const uniqueElements = Array.from(new Map(atoms.map((atom) => [atom.element.symbol, atom.element])).values());

  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-md border border-slate-800 bg-slate-950">
      <div className="absolute left-5 top-5 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
        <p className="text-xs font-semibold text-slate-100">{candidate.name}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">Element-sized molecular model</p>
      </div>
      <div className="absolute right-5 top-5 max-w-[220px] rounded-md border border-slate-800 bg-slate-950 p-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Elements</p>
        <div className="grid grid-cols-2 gap-1.5">
          {uniqueElements.map((item) => (
            <div key={item.symbol} className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span>{item.symbol}</span>
              <span className="text-slate-600">Z{item.atomicNumber}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-12 bottom-28 h-16 rounded-[50%] border border-slate-700 bg-slate-900" />
      {atoms.sort((a, b) => a.z - b.z).map((atom) => <MoleculeBall key={atom.id} atom={atom} />)}
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
        <StatPill label="Activity" value={candidate.predicted_activity.toFixed(3)} color={colors.cyan} pct={candidate.predicted_activity * 100} />
        <StatPill label="Selectivity" value={`${candidate.predicted_selectivity.toFixed(1)}%`} color={colors.violet} pct={candidate.predicted_selectivity} />
        <StatPill label="Stability" value={`${candidate.predicted_stability.toFixed(0)}h`} color={colors.green} pct={(candidate.predicted_stability / 1200) * 100} />
      </div>
    </div>
  );
}

function MoleculePanel({ data, selectedId, onSelect }: { data: Candidate[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = data.find((candidate) => candidate.id === selectedId) || data[0];

  return (
    <motion.div key="molecule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.slice(0, 10).map((candidate) => (
          <button key={candidate.id} type="button" onClick={() => onSelect(candidate.id)} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold transition ${selected.id === candidate.id ? "border-cyan-500 bg-slate-800 text-cyan-100" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}>
            {candidate.name}
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <MoleculeView candidate={selected} />
        <div className="space-y-3">
          <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <p className="text-base font-bold text-slate-100">{selected.name}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{selected.smiles}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-cyan-200">{selected.metal_type || "Metal"}</span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-emerald-200">{selected.support_material || "Support"}</span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-violet-200">{selected.type === "known" ? "Known" : "AI Generated"}</span>
            </div>
          </div>
          <StatPill label="Activity" value={`${selected.predicted_activity.toFixed(3)} mol/g/s`} color={colors.cyan} pct={selected.predicted_activity * 100} />
          <StatPill label="Selectivity" value={`${selected.predicted_selectivity.toFixed(1)}%`} color={colors.violet} pct={selected.predicted_selectivity} />
          <StatPill label="Stability" value={`${selected.predicted_stability.toFixed(0)}h`} color={colors.green} pct={(selected.predicted_stability / 1200) * 100} />
          <StatPill label="Confidence" value={`${(selected.predicted_confidence * 100).toFixed(0)}%`} color={colors.yellow} pct={selected.predicted_confidence * 100} />
          {selected.metadata?.rationale && <p className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-400">{selected.metadata.rationale}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function PerformancePlot({ candidates }: { candidates: Candidate[] }) {
  const [activeTab, setActiveTab] = useState<"scatter" | "ranking" | "molecule">("scatter");
  const rawData = candidates.length > 0 ? candidates : demoCandidates;
  const data = useMemo(() => [...rawData].sort((a, b) => score(b) - score(a)), [rawData]);
  const [selectedId, setSelectedId] = useState(data[0]?.id || "demo-1");
  const selectedStillExists = data.some((candidate) => candidate.id === selectedId);
  const effectiveSelectedId = selectedStillExists ? selectedId : data[0].id;

  const selectAndOpenMolecule = (id: string) => {
    setSelectedId(id);
    setActiveTab("molecule");
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-950">
            <Layers3 className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Performance Visualization</h3>
            <p className="text-xs text-slate-500">Simple plots and element-sized molecule balls</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">{data.length} candidates</span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-slate-950/30 px-5 py-3">
        <TabButton active={activeTab === "scatter"} onClick={() => setActiveTab("scatter")} icon={BarChart3} label="Scatter Plot" />
        <TabButton active={activeTab === "ranking"} onClick={() => setActiveTab("ranking")} icon={Atom} label="Ranking" />
        <TabButton active={activeTab === "molecule"} onClick={() => setActiveTab("molecule")} icon={Box} label="Molecule" />
      </div>

      <div className="p-5">
        {activeTab === "scatter" && <ScatterPanel data={data} />}
        {activeTab === "ranking" && <BarPanel data={data} onSelect={selectAndOpenMolecule} />}
        {activeTab === "molecule" && <MoleculePanel data={data} selectedId={effectiveSelectedId} onSelect={setSelectedId} />}
      </div>
    </div>
  );
}
