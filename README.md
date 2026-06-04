# GEDI Forest Structure Maps

A [Google Earth Engine](https://earthengine.google.com/) web application that generates **wall-to-wall forest structure maps** from [GEDI](https://gedi.umd.edu/) spaceborne LiDAR, combined with optical satellite imagery and a machine-learning model.

The tool lets users pick an area of interest, choose a forest structural metric, run a Random Forest model, and visualize, evaluate, and download the resulting map — from local to national scales.

🌍 **Live app:** https://ee-calvites1990.projects.earthengine.app/view/gedi-foreststructuremaps

📖 **User guide:** https://openforest4d.org/gee_gedi_forest_structure_maps/

---

## Forest structural metrics

The app can map any one of the following GEDI-derived metrics:

| Metric | Description | Unit |
|--------|-------------|------|
| Top-of-Canopy Height | Relative height of the canopy top | m |
| Maximum Canopy Height | Maximum canopy height | m |
| Plant Area Index (PAI) | Total one-sided plant area per unit ground area | m²/m² |
| Foliage Height Diversity (FHD) | Vertical heterogeneity of plant material | unitless |
| Canopy Cover | Fraction of ground covered by canopy | 0–1 |
| Aboveground Biomass Density (AGBD) | Aboveground biomass per unit area | Mg/ha |

---

## How it works

1. **Reference data** — GEDI footprints are filtered (full-power beams, nighttime, minimum sensitivity) over a user-defined time window and used as the response variable.
2. **Predictors** — A cloud-filtered optical composite (HLS/Sentinel bands) plus terrain variables (elevation, slope, aspect) and coordinates are stacked as model inputs.
3. **Forest mask** — Optional masking to forested pixels using Dynamic World, or no mask.
4. **Model** — A Random Forest regressor is trained on a 70/30 train/test split to relate predictors to the GEDI metric, then applied wall-to-wall across the area of interest.
5. **Evaluation** — Train and test scatter plots, a variable-importance chart, and a performance table (R², RMSE, MAE, Bias, N) are produced.
6. **Outputs** — The continuous map is rendered, and can be downloaded per grid tile (GeoTIFF), exported to Google Drive, or summarized as a metrics CSV.

---

## Using the app

1. **Select the area of interest** — draw a polygon on the map, or upload a boundary as an Earth Engine asset.
2. **Set the data options** — choose the forest mask source, the GEDI time window, the satellite image date range, and the maximum allowed cloud cover.
3. **Choose the model and metric** — select Random Forest, set the number of trees, and pick one forest structural metric.
4. **Run** — the map is generated along with the evaluation figures and the performance table.
5. **Download** — click a grid tile to download that tile as a GeoTIFF, optionally export the full map to Google Drive, or download the performance table as a CSV.

---

## Repository structure

The application is organized as a main user-interface script plus a set of Earth Engine library modules (mapping engine, GEDI processing, optical compositing, sampling, plotting/export utilities). See the individual scripts for details.

---

## Citation

If you use this tool in your work, please cite OpenForest4D and acknowledge GEDI as the source of the LiDAR reference data.

---

## Funding & acknowledgements

OpenForest4D is funded by U.S. National Science Foundation awards **2409885**, **2409886**, and **2409887**.

Developed at the University of Florida as part of [OpenForest4D](https://openforest4d.org/).

---

## License

AGPL-3.0 
