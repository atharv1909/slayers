"""
Seed the database with synthetic catalyst candidates.
Run from repo root: python scripts/seed_db.py
Requires DATABASE_URL in your .env file.
"""
import sys
import os
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai"))

from db.models import init_db
from db.crud import create_project, insert_candidates, insert_experiment, get_candidates_for_project

METALS = ["Fe", "Co", "Ni", "Cu", "Pd", "Pt", "Ru", "Rh", "Mo", "In"]
SUPPORTS = ["TiO2", "Al2O3", "SiO2", "CeO2", "ZSM-5", "MgO", "ZrO2", "Carbon"]
PROMOTERS = ["K", "Na", "La", "Ce", "Ba", ""]
DBS = ["Materials Project", "Open Catalyst DB", "BRENDA", "CatDB"]

DEMO_REACTIONS = [
    {"name": "Ethanol to Jet Fuel", "reaction": "C2H5OH → C8-C16 alkanes", "reaction_type": "chemical"},
    {"name": "CO2 Hydrogenation", "reaction": "CO2 + 3H2 → CH3OH + H2O", "reaction_type": "chemical"},
    {"name": "Cellulose to Ethanol", "reaction": "C6H10O5 → C2H5OH", "reaction_type": "biological"},
]

SUPPORT_SMILES = {
    "TiO2": "[Ti](=O)=O", "Al2O3": "[Al+3].[O-2]", "SiO2": "[Si](=O)=O",
    "CeO2": "[Ce](=O)=O", "ZSM-5": "[Al].[Si].[O]", "MgO": "[Mg]=O",
    "ZrO2": "[Zr](=O)=O", "Carbon": "C",
}


def make_smiles(metal: str, support: str, promoter: str = "") -> str:
    base = f"[{metal}]"
    if promoter:
        base = f"[{promoter}].{base}"
    return f"{base}.{SUPPORT_SMILES.get(support, '[O]')}"


def seed(user_id: str):
    print("Initialising database tables...")
    init_db()

    for demo in DEMO_REACTIONS:
        project = create_project(
            user_id=user_id,
            name=demo["name"],
            reaction=demo["reaction"],
            reaction_type=demo["reaction_type"],
        )
        project_id = project["id"]
        print(f"Created project: {demo['name']} ({project_id})")

        candidates = []
        for i in range(16):
            metal = METALS[i % len(METALS)]
            support = SUPPORTS[i % len(SUPPORTS)]
            promoter = PROMOTERS[i % len(PROMOTERS)]
            ctype = "known" if i < 8 else "novel"
            source_db = DBS[i % len(DBS)] if ctype == "known" else "AI Generated"
            name = f"{metal}/{support}" + (f"-{promoter}" if promoter else "")

            candidates.append({
                "project_id": project_id,
                "name": name,
                "smiles": make_smiles(metal, support, promoter),
                "type": ctype,
                "source_db": source_db,
                "predicted_activity": round(0.3 + random.random() * 0.6, 4),
                "predicted_selectivity": round(40 + random.random() * 55, 2),
                "predicted_stability": round(100 + random.random() * 900, 1),
                "predicted_confidence": round(0.55 + random.random() * 0.35, 3),
                "actual_yield": round(25 + random.random() * 55, 2) if i < 4 else None,
                "actual_selectivity": round(35 + random.random() * 50, 2) if i < 4 else None,
                "actual_stability": round(100 + random.random() * 700, 1) if i < 4 else None,
                "metal_type": metal,
                "support_material": support,
                "metadata": {"promoter": promoter, "seed": True},
            })

        insert_candidates(candidates)
        print(f"  → Inserted {len(candidates)} candidates")

        seeded = get_candidates_for_project(project_id)[:4]
        experiments = []
        for c in seeded:
            pred_yield = (c.get("predicted_activity") or 0.6) * 100
            actual_yield = pred_yield * (0.4 + random.random() * 0.8)
            experiments.append({
                "candidate_id": c["id"],
                "user_id": user_id,
                "yield_measured": round(actual_yield, 2),
                "selectivity_measured": round(40 + random.random() * 50, 2),
                "stability_measured": round(200 + random.random() * 600, 1),
                "conditions": {
                    "temperature_C": random.choice([220, 250, 280, 300]),
                    "pressure_bar": random.choice([20, 50, 100]),
                    "space_velocity_h": round(2000 + random.random() * 6000, 0),
                    "H2_CO2_ratio": random.choice([3.0, 4.0, 5.0]),
                },
                "notes": random.choice([
                    "Lower yield than predicted — possible sulfur contamination.",
                    "Rapid deactivation after 50h. Sintering suspected.",
                    "Close to prediction. Recommend scale-up trial.",
                    None,
                ]),
            })
            insert_experiment(experiments[-1])

        print(f"  → Inserted {len(experiments)} experiments")

    print("\nSeed complete.")


if __name__ == "__main__":
    user_id = os.getenv("SEED_USER_ID")
    if not user_id:
        print("Set SEED_USER_ID env var to your actual user ID from the auth system.")
        print("Example: SEED_USER_ID=abc-123 python scripts/seed_db.py")
        sys.exit(1)
    seed(user_id)
