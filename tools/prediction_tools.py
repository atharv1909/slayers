import hashlib
from tools.chem_tools import get_metal_centers, get_num_heavy_atoms

METAL_ACTIVITY_MAP = {
    "Pt": 0.85, "Pd": 0.82, "Ru": 0.78, "Rh": 0.80, "Ir": 0.76,
    "Ni": 0.71, "Co": 0.68, "Fe": 0.65, "Cu": 0.62, "Mo": 0.60,
    "Mn": 0.55, "V": 0.52, "Cr": 0.50, "Zn": 0.45, "In": 0.48,
    "Au": 0.40, "Ag": 0.38,
}

SUPPORT_SELECTIVITY_MAP = {
    "TiO2": 8.0, "CeO2": 10.0, "ZrO2": 7.0,
    "Al2O3": 2.0, "SiO2": 0.0, "MgO": 4.0,
    "ZSM-5": 12.0, "Carbon": -2.0,
}

METAL_STABILITY_MAP = {
    "Pt": 900, "Pd": 800, "Ru": 750, "Rh": 820, "Ir": 880,
    "Ni": 350, "Co": 400, "Fe": 300, "Cu": 280, "Mo": 500,
    "Mn": 250, "V": 220, "Cr": 200,
}


def predict_activity_heuristic(smiles: str, seed: float) -> float:
    metals = get_metal_centers(smiles)
    if not metals:
        return 0.30 + seed * 0.20
    base = sum(METAL_ACTIVITY_MAP.get(m, 0.50) for m in metals) / len(metals)
    synergy = 0.05 if len(metals) > 1 else 0.0
    n_atoms = get_num_heavy_atoms(smiles) or 10
    complexity_penalty = min(0.08, (n_atoms - 10) * 0.003) if n_atoms > 10 else 0.0
    noise = (seed - 0.5) * 0.10
    return max(0.1, min(1.0, base + synergy - complexity_penalty + noise))


def predict_selectivity_heuristic(smiles: str, seed: float) -> float:
    smiles_upper = smiles.upper()
    support_bonus = sum(
        modifier for key, modifier in SUPPORT_SELECTIVITY_MAP.items()
        if key.upper() in smiles_upper
    )
    base = 60.0 + support_bonus
    noise = (seed - 0.5) * 20.0
    return max(10.0, min(99.0, base + noise))


def predict_stability_heuristic(smiles: str, seed: float) -> float:
    metals = get_metal_centers(smiles)
    if not metals:
        return 200 + seed * 400
    base = sum(METAL_STABILITY_MAP.get(m, 300) for m in metals) / len(metals)
    noise = (seed - 0.5) * 200
    return max(50.0, base + noise)


def estimate_uncertainty(smiles: str, candidate_type: str) -> float:
    metals = get_metal_centers(smiles)
    well_studied = {"Pt", "Pd", "Ni", "Cu", "Fe", "Co", "Ru"}
    known_fraction = len([m for m in metals if m in well_studied]) / max(len(metals), 1)
    base_confidence = 0.85 if candidate_type == "known" else 0.55
    return round(base_confidence * (0.7 + 0.3 * known_fraction), 3)
