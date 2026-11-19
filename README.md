# Edge AI for Camera-Trap Wildlife Monitoring (`mcunet-in3`)

**Interactive 9-Slide Academic Presentation** — *AIMS · AI for Science: Deep Learning for Ecology*

> **Live Web Presentation (GitHub Pages):**  
> **[https://yke0let.github.io/edge-ai-camera-trap-tinyml/#1](https://yke0let.github.io/edge-ai-camera-trap-tinyml/#1)**

---

## Project Overview

This presentation summarizes our dual-track TinyML camera-trap wildlife monitoring study built around ImageNet-pretrained **`mcunet-in3`** (`176×176` RGB input) under strict microcontroller resource constraints (`SRAM ≤ 320 KB`, `Flash ≤ 1 MB`, `Latency < 15 s / frame`):

| Metric | Track A — Bird vs. Not-Bird | Track B — TinyML MegaDetector |
|---|---|---|
| **Classes** | 2 (`bird`, `not_bird`) | 4 (`animal`, `empty`, `person`, `vehicle`) |
| **Parameters** | `576,730` | `577,052` |
| **Dataset Scale** | `36,193` imgs (8 sources; 4 unseen OOD test sets) | `690,881` imgs (4 sources; MD5 location-disjoint 80/10/10) |
| **Best Validation** | `85.45%` accuracy (loss `0.3241`) | `90.0%` accuracy · `0.8994` macro-F1 |
| **Test (FP32)** | `66.39%` OOD accuracy (`6,400` imgs) | `88.47%` accuracy · `0.905` macro-F1 (`66,027` imgs) |
| **INT8 TFLite Flash** | `785.9 KB` (≤ 1 MB ✅) | `786 KB` (≤ 1 MB ✅) |
| **Peak SRAM Audit** | `293 KB` TinyEngine target | `389 KB` peak at explicit `PAD` (`~600 KB` TFLM arena ❌ > `320 KB`) |

---

## Slide Index (9 Slides)

1. **`#1` — Title Slide** *(Ecological woodland dawn backdrop)* — Project framing, dual tracks, and MCU budget badges
2. **`#2` — Motivation, Hardware Constraints & Dual-Track Overview** — Field bottlenecks & comparative experimental matrix
3. **`#3` — Multi-Source Datasets & Leakage-Free Splits** *(Ecological savanna backdrop)* — Spatial splits, anti-shortcut pairing & MD5 camera hashing
4. **`#4` — Teacher-Guided Data Cleaning Pipeline (`MDv5a`)** — Animated burst denoising pipeline & real field bugs caught (`25%` Caltech `"empty"`, Safari `"empty"` fix, `~1,750` `"goose"`/`"mongoose"` taxonomy fix)
5. **`#5` — Model Architecture: `mcunet-in3`** — Interactive animated 18-block `MBInvertedConvLayer` & 11-skip residual SVG schematic
6. **`#6` — Track A: Training & OOD Generalization** — Animated CPU learning curve vs. `66.39%` OOD benchmark & `45.0%` bird recall asymmetry
7. **`#7` — Track B: Two-Phase Training & Test Results** — Animated per-class F1, per-source accuracy & `91.8%` `animal ↔ empty` error breakdown
8. **`#8` — Edge Export, INT8 Quantization & MCU Memory Audit** — Animated TF2 rebuilder pipeline, INT8 confidence parity & Flash/SRAM gauges
9. **`#9` — Technical Risks, Limitations & Next Steps** *(Nocturnal forest canopy backdrop)* — SRAM closure, Track A recall roadmap & licensing governance

---

## Navigation & Features

- **Keyboard:** `←` / `→` or `Space` (previous/next), `1`–`9` (jump to slide), `O` (3×3 slide overview), `N` (speaker notes), `R` (replay slide animations)
- **Direct URLs:** `#1` through `#9` hash deep-linking
- **Print / PDF Export:** Click **Print** (or `Ctrl/Cmd + P`) for clean 16:9 landscape export (`@media print` renders all 9 slides with animations completed)
- **Zero-dependency static bundle:** 100% relative asset paths (`./styles.css`, `./app.js`, `./assets/images/...`), runs directly on GitHub Pages or locally.

## Local Preview

```bash
python3 -m http.server 8000
# Open http://localhost:8000/#1
```
