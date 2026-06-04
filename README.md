# GEDI Forest Structure Maps

A [Google Earth Engine](https://earthengine.google.com/) web application that generates **wall-to-wall forest structure maps** from [GEDI](https://gedi.umd.edu/) spaceborne LiDAR, combined with optical satellite imagery and a machine-learning model.

The tool lets users pick an area of interest, choose a forest structural metric, run a Random Forest model, and visualize, evaluate, and download the resulting map — from local to national scales.

🌍 **Live app:** https://ee-calvites1990.projects.earthengine.app/view/gedi-foreststructuremaps

📖 **User guide:** https://openforest4d.org/gee_gedi_forest_structure_maps/
---
## User Interface

<img width="1774" height="886" alt="Image" src="https://github.com/user-attachments/assets/965272a2-c2f7-4e42-95a8-b561b0e16347" />

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

## Run from code (Earth Engine Code Editor)

You can run the mapper directly from a script instead of the app interface.
This requires the full repository to be present (`GEDI_source`, `hls_source`,
`library`, `OF4D-GM_main`) and the `require` username to match your account.

### Step 1 — Set up and run the GEDI Mapper

```javascript
// Define your Area Of Interest (a geometry, or an uploaded asset / FeatureCollection)
var aoi = ee.Geometry.Rectangle([-85.0, 30.4, -84.6, 30.7]);   // <-- replace with your AOI

// Import the GEDI Mapper library
var library = require("users/calvites1990/OF4D-GM:OF4D-GM_main");

// Configure and run the GediMapper
var GEDI = library.GediMapper(
  aoi,            // Area Of Interest (AOI)
  2019,           // YYYY  — year
  '03-01',        // MM-DD — start of satellite-image date range
  '08-31',        // MM-DD — end of satellite-image date range
  '2019-01-01',   // YYYY-MM-DD — start of GEDI collection
  '2020-12-31',   // YYYY-MM-DD — end of GEDI collection
  70,             // cloud coverage percentage (e.g. 70)
  null,           // quantile (not required for these metrics)
  'RF',           // model type: 'RF' (Random Forest)
  'none',         // legacy mask argument — keep 'none'
  'singleGEDI',   // metric: 'singleGEDI' | 'meanGEDI' | 'pai' | 'fhd_normal' | 'cover' | 'agbd'
  'None',         // forest mask source: 'None' | 'DynamicWorld'
  '2019-01-01',   // Dynamic World start  (used only if 'DynamicWorld')
  '2020-01-01',   // Dynamic World end    (used only if 'DynamicWorld')
  true,           // trees only           (used only if 'DynamicWorld')
  200,            // number of trees in Random Forest (numTreesRF)
  'NULL','NULL','NULL','NULL',         // RF extra params — unused
  'NULL','NULL','NULL','NULL','NULL',  // GBM params — unused
  'NULL','NULL'                        // CART params — unused
);

// Zoom to the AOI
Map.centerObject(aoi, 10);
```

### Step 2 — Export the generated map to Google Drive

```javascript
var Map_out = ee.Image(ee.List(GEDI).get(0));   // GediMapper returns [classifiedImage]

Export.image.toDrive({
  image: Map_out,
  description: 'OF4D_GEDI_metric',
  folder: 'ee_drive',
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});
```

> **Notes**
> - Change `calvites1990` in the `require` path to your own username if you cloned the repository.
> - `Export.image.toDrive` runs as a background task with no size cap, so it is the recommended route for large areas. The 32 MB limit only applies to direct download URLs (`getDownloadURL`).

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
