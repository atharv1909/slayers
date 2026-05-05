export function generateSyntheticCandidates(projectId: string, count: number) {
  const metals = ["Fe", "Co", "Ni", "Cu", "Zn", "Pd", "Pt", "Au", "Ag", "Rh"];
  const supports = ["TiO2", "Al2O3", "SiO2", "CeO2", "ZSM-5", "Carbon", "MgO", "ZrO2"];
  const catalystNames = [
    "Pt/TiO2", "Pd/Al2O3", "Ni/SiO2", "Co/CeO2", "Cu/ZSM-5",
    "Fe/Carbon", "Au/MgO", "Ag/ZrO2", "Rh/TiO2", "Zn/Al2O3",
    "Pt/SiO2", "Ni/CeO2", "Co/ZSM-5", "Cu/Carbon", "Pd/MgO",
  ];

  return Array.from({ length: count }, (_, i) => {
    const metal = metals[i % metals.length];
    const support = supports[i % supports.length];
    const isKnown = i < 15;
    const name = isKnown ? catalystNames[i % catalystNames.length] : `AI-${metal}/${support}-${i}`;

    return {
      project_id: projectId,
      name,
      smiles: isKnown ? `[${metal}].[${support}]` : `C1CC[${metal}]1.O=[${support}]`,
      type: isKnown ? "known" : "novel",
      source_db: isKnown
        ? ["Materials Project", "Open Catalyst", "BRENDA", "Catalysis-Hub"][i % 4]
        : "AI Generated",
      predicted_activity: +(0.3 + Math.random() * 0.6).toFixed(3),
      predicted_selectivity: +(40 + Math.random() * 55).toFixed(1),
      predicted_stability: +(100 + Math.random() * 900).toFixed(0),
      predicted_confidence: +(0.6 + Math.random() * 0.35).toFixed(2),
      metal_type: metal,
      support_material: support,
      metadata: {
        surface_area: +(50 + Math.random() * 200).toFixed(1),
        pore_size: +(2 + Math.random() * 8).toFixed(1),
        synthesis_method: ["Impregnation", "Sol-gel", "Co-precipitation", "Hydrothermal"][i % 4],
      },
    };
  });
}
