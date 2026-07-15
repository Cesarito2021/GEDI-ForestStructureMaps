//-----------------------------------------------------------------------------
// Palette color for GEE GEDI
//------------------------------------------------------------------------------

var scalecolor = function(min,max,classified_clip){
var palettes = require('users/gena/packages:palettes');

var visParam = {min: min,max: max ,palette: palettes.niccoli.linearl[7].reverse()} 

var layer = Map.addLayer(classified_clip, visParam, 'GEDI metric');
layer.setOpacity(0.5);

var vis = visParam;
// Set up number of differents levels of colors
var nSteps = 20

// Creates a color bar thumbnail image for use in legend from the given color palette
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, nSteps, 0.1],
    dimensions: '200x10',
    format: 'png',
    min: 0,
    max: nSteps,
    palette: palette,
  };
}

// Create the colour bar for the legend
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0).int(),
  params: makeColorBarParams(vis.palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
});

// Create a panel with three numbers for the legend
var legendLabels = ui.Panel({
  widgets: [
  ui.Label(vis.min, {margin: '6px 10px'}),//{margin: '4px 8px'}),
  ui.Label(((vis.max-vis.min) / 2+vis.min),
    {margin: '6px 10px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '6px 10px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal'),
});

// Legend title
var legendTitle = ui.Label({
  value: 'GEDI Map',
  style: {fontWeight: 'bold'}
});

// Add the legendPanel to the map
var legendPanel = ui.Panel({
  widgets: [legendTitle, colorBar, legendLabels],
  style: {
    position: 'top-center',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid black'
  }
});

Map.add(legendPanel);
return legendPanel;}
exports.scalecolor = scalecolor;

//------------------------------------------------------------------------------
// Samping Design for large forest covers
//------------------------------------------------------------------------------
var generateSamplingSites = function(region, cellSize, seed,mask_raster) {
// Generate a random image of integers in the specified region and projection.
var proj = ee.Projection("EPSG:4326").atScale(cellSize);
var cells = ee.Image.random(seed).multiply(1000000).int().clip(region).reproject(proj);

var random = ee.Image.random(seed).multiply(1000000).int();
var maximum = cells.addBands(random).reduceConnectedComponents(ee.Reducer.max());
// Find all the points that are local maximums.
var points = random.eq(maximum).selfMask().clip(region);
// Create a mask to remove every pixel with even coordinates in either X or Y.
var mask_img = ee.Image.pixelCoordinates(proj)
  .expression("!((b('x') + 0.5) % 2 != 0 || (b('y') + 0.5) % 2 != 0)");
  
var strictCells = cells.updateMask(mask_img)
  .updateMask(mask_img
  .updateMask(mask_raster.eq(1)))
  .reproject(proj);
   
var strictMax = strictCells.addBands(random).reduceConnectedComponents(ee.Reducer.max());
var strictPoints = random.eq(strictMax).selfMask().clip(region);
  
var samples = strictPoints.reduceToVectors({
  reducer: ee.Reducer.countEvery(), 
  geometry: region,
  crs: proj.scale(1/16, 1/16), 
  geometryType: "centroid", 
  maxPixels: 1e9
});
  
// Add a buffer around each point
var buffer = samples.map(function(f) { return f.buffer(ee.Number(cellSize).divide(2)) });
  
return {
  buffer: buffer,
};
}
exports.generateSamplingSites = generateSamplingSites;
