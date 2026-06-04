# OF4D-GM — Earth Engine source scripts

This folder contains the Google Earth Engine (JavaScript) source code for the
**GEDI Forest Structure Maps** app.

🌍 Live app: https://ee-calvites1990.projects.earthengine.app/view/gedi-foreststructuremaps
📖 User guide: https://openforest4d.org/gee_gedi_forest_structure_maps/

> Note: these `.js` files are the **archived source**. The app actually runs from an
> Earth Engine code repository (`users/<username>/OF4D-GM`), not from GitHub.

## Files

| File | Role |
|------|------|
| `OF4D-GM_UI.js` | **Entry point.** Builds the user interface (AOI selection, settings, Run/Reset) and launches the model. Run this script to start the app. |
| `OF4D-GM_main.js` | `GediMapper` — builds predictors, trains the Random Forest, predicts wall-to-wall, and draws the scatter plots, variable-importance chart, performance table, and CSV download. |
| `GEDI_source.js` | `ToGEDI` — filters and processes GEDI footprints into the reference variable. |
| `hls_source.js` | `calculateCompositeClipHLS` — builds the cloud-filtered optical (HLS/Sentinel) composite used as predictors. |
| `library.js` | Merged utilities: `scalecolor` (map visualization + legend), `generateSamplingSites` (spatial sampling), `DownloadImg` (Google Drive export). |

## Dependency map (require)

```
OF4D-GM_UI
 ├── OF4D-GM_main   (GediMapper)
 │     ├── GEDI_source        (ToGEDI)
 │     ├── hls_source         (calculateCompositeClipHLS)
 │     └── library            (scalecolor, generateSamplingSites)
 └── library                  (DownloadImg)

library.scalecolor also requires: users/gena/packages:palettes
```

## Deploy in Earth Engine

1. In the EE Code Editor, create (or open) a repository, e.g. `users/<username>/OF4D-GM`.
2. Create five scripts with these exact names and paste in the matching file contents:
   `OF4D-GM_UI`, `OF4D-GM_main`, `GEDI_source`, `hls_source`, `library`.
3. **Update the `require()` paths.** The scripts reference `users/calvites1990/OF4D-GM:...`.
   Change `calvites1990` to your own username (and keep the script names identical to the list above).
4. Open and **Run `OF4D-GM_UI`** to launch the interface.
5. (Optional) Publish it as an Earth Engine App from the Code Editor.

## Notes

- Forest mask options: `None` or `DynamicWorld`.
- Model: Random Forest regression (number of trees set in the UI).
- Outputs: per-tile GeoTIFF download, optional Google Drive export, and a Model Performance CSV.

## License

Distributed under the GNU AGPL-3.0 license (see the repository `LICENSE`).