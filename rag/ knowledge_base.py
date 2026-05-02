from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP

# Static chemistry knowledge base — embedded at startup
# In production, this would be loaded from PDFs (catalysis papers, GPS process docs)
CHEMISTRY_KNOWLEDGE = [
    {
        "title": "Heterogeneous Catalysis Fundamentals",
        "content": (
            "Heterogeneous catalysts accelerate reactions at solid-fluid interfaces. "
            "Key descriptors include the d-band center (for transition metals), "
            "Brønsted-Evans-Polanyi (BEP) relations linking activation energy to reaction energy, "
            "and the Sabatier principle — optimal catalysts bind intermediates neither too strongly nor too weakly. "
            "Common failure modes: sintering (particle agglomeration at high temperature), "
            "sulfur poisoning (strong S adsorption on metal sites), coking (carbon deposition blocking active sites), "
            "and leaching (loss of active metal into solution phase)."
        ),
        "metadata": {"category": "fundamentals", "source": "Ertl, Knözinger, Schüth — Handbook of Heterogeneous Catalysis"},
    },
    {
        "title": "Ethanol Upgrading to Jet Fuel",
        "content": (
            "Ethanol-to-jet (ETJ) conversion follows the Guerbet reaction sequence: "
            "ethanol dehydrogenation → acetaldehyde → aldol condensation → crotonaldehyde → "
            "hydrogenation → n-butanol → dehydration → butene → oligomerization → hydrogenation → jet range alkanes. "
            "Key catalysts: Cu-based (dehydrogenation step), Al2O3 or ZSM-5 (dehydration), "
            "Pd/Ni/Co supported on oxides (hydrogenation). "
            "Carbon selectivity to jet-range (C8-C16): typically 50-70% depending on catalyst and conditions. "
            "Energy efficiency advantage vs conventional: 40-60% lower lifecycle CO2 when using bioethanol feedstock."
        ),
        "metadata": {"category": "ethanol_to_jet", "source": "Wang et al., Green Chemistry 2023"},
    },
    {
        "title": "CO2 Hydrogenation to Methanol",
        "content": (
            "CO2 + 3H2 → CH3OH + H2O (ΔH = -49.5 kJ/mol). "
            "Industrial standard: Cu/ZnO/Al2O3 at 200-300°C, 50-100 bar. "
            "Novel catalysts: In2O3-based (>99% methanol selectivity), MoS2, "
            "single-atom Pd/In2O3. "
            "Promoters: K, Cs increase selectivity by suppressing CO formation. "
            "Key challenge: water management — produced water inhibits active sites. "
            "Cu particle size effect: optimal 3-8 nm for Cu/ZnO systems. "
            "Support effect: ZrO2 improves CO2 activation vs Al2O3."
        ),
        "metadata": {"category": "co2_hydrogenation", "source": "Álvarez et al., Chemical Society Reviews 2017"},
    },
    {
        "title": "Metal-Support Interaction (MSI) in Catalysis",
        "content": (
            "Strong Metal-Support Interaction (SMSI) occurs when reducible oxide supports (TiO2, CeO2, Nb2O5) "
            "partially encapsulate metal nanoparticles after reduction at high temperature. "
            "SMSI can block active sites but also creates unique interfacial sites with dual functionality. "
            "Weak MSI: SiO2, Al2O3 — metal particles mobile, prone to sintering. "
            "Tuning MSI: wet impregnation vs co-precipitation affects dispersion. "
            "Characterization: HAADF-STEM, CO-DRIFTS, TPR (temperature-programmed reduction). "
            "For ETJ catalysts, Al2O3 support provides adequate acidity for dehydration while minimizing SMSI."
        ),
        "metadata": {"category": "msi", "source": "Tauster, Accounts of Chemical Research 1987"},
    },
    {
        "title": "Synthetic Biology for Biofuel Pathways",
        "content": (
            "Metabolic engineering of microbial hosts (S. cerevisiae, E. coli, C. thermocellum) "
            "enables consolidated bioprocessing of lignocellulosic biomass. "
            "Key enzymes: cellulase (3.2.1.4) for cellulose hydrolysis, "
            "pyruvate decarboxylase (4.1.1.1) for ethanol fermentation, "
            "fatty acid synthase for alkane production. "
            "Flux balance analysis (FBA) identifies metabolic bottlenecks. "
            "Directed evolution strategies: error-prone PCR, DNA shuffling for enzyme improvement. "
            "Cofactor engineering (NADH/NADPH balance) critical for redox-intensive pathways. "
            "Carbon yield cellulose-to-ethanol: theoretical 0.51 g/g, practical 0.38-0.44 g/g."
        ),
        "metadata": {"category": "synthetic_biology", "source": "Lynd et al., Nature Biotechnology 2017"},
    },
    {
        "title": "Catalyst Screening Descriptors",
        "content": (
            "High-throughput catalyst screening uses computed descriptors to predict activity before synthesis. "
            "DFT-derived descriptors: adsorption energies (ΔE_CO, ΔE_O, ΔE_H), "
            "d-band center εd, oxygen vacancy formation energy (for reducible oxides). "
            "Volcano plots: relate descriptor to turnover frequency (TOF). "
            "Linear scaling relations: ΔE_OH ≈ 0.5 ΔE_O + const (ORR), used to build activity maps. "
            "Machine learning surrogates: GNN trained on OC20 dataset predicts adsorption energies "
            "with MAE < 0.3 eV for known catalyst families. "
            "Uncertainty quantification: ensemble methods flag out-of-distribution predictions."
        ),
        "metadata": {"category": "screening", "source": "Norskov et al., Nature Chemistry 2009"},
    },
]


def load_knowledge_base() -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "],
    )
    docs = []
    for entry in CHEMISTRY_KNOWLEDGE:
        raw_doc = Document(page_content=entry["content"], metadata={
            **entry["metadata"],
            "title": entry["title"],
        })
        chunks = splitter.split_documents([raw_doc])
        docs.extend(chunks)
    return docs
