"""
Seed Supabase with synthetic catalyst candidates for demo purposes.
Run: python scripts/seed_db.py
"""
import sys
import os
import random
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai"))

from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

METALS = ["Fe", "Co", "Ni", "Cu", "Pd", "Pt", "Ru", "Rh", "Mo", "In"]
SUPPORTS = ["TiO2", "Al2O3", "SiO2", "CeO2", "ZSM-5", "MgO", "ZrO2", "Carbon"]
PROMOTERS = ["K", "Na", "La", "Ce", "Ba", ""]
DBS = ["Materials Project", "Open Catalyst DB", "BRENDA", "CatDB"]

DEMO_REACTIONS = [
    {"name": "Ethanol to Jet Fuel", "reaction": "C2H5OH → C8-C16 alkanes", "reaction_type": "chemical"},
    {"name": "CO2 Hydrogenation", "reaction": "CO2 + 3H2 → CH3OH + H2O", "reaction_type": "chemical"},
    {"name": "Cellulose to Ethanol", "reaction": "C6H10O5 → C2H5OH", "reaction_type": "biological"},
]

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


def make_smiles(metal: str, support: str, promoter: str = "") -> str:
    base = f"[{metal}]"
    if promoter:
        base = f"[{promoter}].{base}"
    support_map = {
        "TiO2": "[Ti](=O)=O", "Al2O3": "[Al+3].[O-2]", "SiO2": "[Si](=O)=O",
        "CeO2": "[Ce](=O)=O", "ZSM-5": "[Al].[Si].[O]", "MgO": "[Mg]=O",
        "ZrO2": "[Zr](=O)=O", "Carbon": "C",
    }
    return f"{base}.{support_map.get(support, '[O]')}"


def seed_projects_and_candidates():
    projects_created = []

    for demo in DEMO_REACTIONS:
        project_id = str(uuid.uuid4())
        project = {
            "id": project_id,
            "name": demo["name"],
            "reaction": demo["reaction"],
            "reaction_type": demo["reaction_type"],
            "status": "active",
            "user_id": DEMO_USER_ID,
        }
        result = supabase.from_("projects").insert(project).execute()
        print(f"✅ Created project: {demo['name']} ({project_id})")
        projects_created.append(project_id)

        # Seed 8 known + 8 novel candidates per project
        candidates = []
        for i in range(16):
            metal = METALS[i % len(METALS)]
            support = SUPPORTS[i % len(SUPPORTS)]
            promoter = PROMOTERS[i % len(PROMOTERS)]
            ctype = "known" if i < 8 else "novel"
            source_db = DBS[i % len(DBS)] if ctype == "known" else "AI Generated"
            name_parts = [f"{metal}/{support}"]
            if promoter:
                name_parts.append(f"-{promoter}")
            name = "".join(name_parts)

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

        supabase.from_("candidates").insert(candidates).execute()
        print(f"   → Inserted {len(candidates)} candidates")

    return projects_created


def seed_experiments(project_id: str):
    candidates = (
        supabase.from_("candidates")
        .select("id, predicted_activity, predicted_selectivity")
        .eq("project_id", project_id)
        .limit(4)
        .execute()
        .data or []
    )

    experiments = []
    for c in candidates:
        pred_yield = (c.get("predicted_activity") or 0.6) * 100
        actual_yield = pred_yield * (0.4 + random.random() * 0.8)
        experiments.append({
            "candidate_id": c["id"],
            "user_id": DEMO_USER_ID,
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
                "Good stability but lower yield than predicted. Check for sulfur contamination.",
                "Excellent initial activity, rapid deactivation after 50h. Sintering suspected.",
                "Close to prediction. Recommend scale-up trial.",
                None,
            ]),
        })

    supabase.from_("experiments").insert(experiments).execute()
    print(f"   → Inserted {len(experiments)} experiments")


if __name__ == "__main__":
    print("🧪 Seeding CatalysisAI database...\n")
    try:
        project_ids = seed_projects_and_candidates()
        for pid in project_ids[:1]:
            seed_experiments(pid)
        print(f"\n✅ Seed complete. {len(project_ids)} projects created.")
        print("   Note: Sign in via GitHub OAuth first to associate projects with your user.")
    except Exception as e:
        print(f"❌ Seed failed: {e}")
        raise
