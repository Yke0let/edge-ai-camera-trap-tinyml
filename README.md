# TinyML MegaDetector — Edge AI for Camera-Trap Wildlife Monitoring (`mcunet-in3`)

**Interactive 9-Slide Academic Presentation** — *AIMS · AI for Science: Deep Learning for Ecology*

> **Live Web Presentation (GitHub Pages):**  
> **[https://yke0let.github.io/edge-ai-camera-trap-tinyml/#1](https://yke0let.github.io/edge-ai-camera-trap-tinyml/#1)**

---

## Research Story

Our goal is to filter camera-trap frames directly on microcontrollers (`SRAM ≤ 320 KB`, `Flash ≤ 1 MB`, `Latency < 15 s / frame`):

1. **Initial Bird Pilot (`bird` vs. `not_bird`, `36,193` imgs):** Because birds are small and agile, low `176×176` edge resolution caused OOD accuracy to drop from `85.45%` (val) to **`66.39%`** with only **`45.0%` bird recall** (`82%` of mistakes = missed birds).
2. **Strategic Pivot → 4-Class TinyML MegaDetector (`animal / empty / person / vehicle`, `690,881` imgs):** Aligning the class taxonomy to edge-camera resolution unlocks **`88.47%` test accuracy** and **`0.905` macro-F1** across `66,027` held-out test images in **`786 KB` INT8 Flash** (`577,052` params).

---

## Slide Index (9 Slides)

1. **`#1` — Title Slide** *(Woodland dawn backdrop)* — Project focus (`animal / empty / person / vehicle`) & MCU budget
2. **`#2` — From Bird Detection to TinyML MegaDetector** — Why we pivoted from birds (`45.0%` recall) to 4 MegaDetector classes (`88.47%` / `0.905` F1)
3. **`#3` — Final Dataset (`690,881` Images)** *(Savanna backdrop)* — 80/10/10 splits, 4 sources & MD5 camera-location anti-leakage
4. **`#4` — Teacher-Guided Data Cleaning (`MDv5a`)** — Animated 4-step burst-denoising pipeline & real data-audit bugs caught
5. **`#5` — Model Architecture: `mcunet-in3`** — Animated 18-block `MBInvertedConvLayer`, 11 residual skips & 4-class `LinearLayer` head
6. **`#6` — Two-Phase GPU Training & Test Results** — Per-class F1 (`0.905` macro) & per-source accuracy (`88.47%` overall)
7. **`#7` — Error Analysis (`66,027` Test Images)** — 4×4 confusion matrix & `91.8%` `animal ↔ empty` error concentration
8. **`#8` — Edge Export, INT8 Quantization & MCU Memory Audit** — Custom TF2 rebuilder, `100%` parity (`conf > 0.7`), Flash (`786 KB` PASS) vs. SRAM (`389 KB` at explicit `PAD` > `320 KB`)
9. **`#9` — Technical Risks, Limitations & Next Steps** *(Nocturnal forest backdrop)* — Closing the SRAM spike, on-board latency bench & licensing governance

---

## Controls & Local Preview

- **Keyboard:** `←` / `→` or `Space`, `1`–`9` direct slide jump, `O` overview grid, `N` speaker notes, `R` replay animations, **Print** for clean 16:9 9-page PDF.

```bash
python3 -m http.server 8000
# Open http://localhost:8000/#1
```
