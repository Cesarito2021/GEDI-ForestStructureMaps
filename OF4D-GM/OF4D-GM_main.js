//***************************************************************************************************************
//********************************************* GEDI Mapper  *******************************************
//***************************************************************************************************************

// floating chart panels — tracked so they don't stack on re-run
var _floatPanels = [];
function _clearFloatPanels() {
  _floatPanels.forEach(function(p){ try { Map.remove(p); } catch(e){} });
  _floatPanels = [];
}

var GediMapper = function(
  aoi, year, start_date, end_date, startDateGEDI, endDateGEDI, cloudsTh, quantile,
  model, mask, gedi_type,

  // ===== NEW INPUTS =====
  forestMaskSource,     // 'None' | 'WorldCover' | 'DynamicWorld'
  dwStart,              // e.g. '2019-01-01'
  dwEnd,                // e.g. '2020-01-01'
  treesOnly,            // true/false

  // old params
  numTreesRF, varSplitRF, minLeafPopuRF, bagFracRF, maxNodesRF,
  numTreesGBM, shrGBM, samLingRateGBM, maxNodesGBM, lossGBM, maxNodesCART, minLeafPopCART
){

  //***************************************************************************************************************
  //  Input Data
  //***************************************************************************************************************

  var startDateWithYear = year + "-" + start_date;
  var endDateWithYear   = year + "-" + end_date;

  //***************************************************************************************************************
  //  Importing Area of Interest (AOI)
  //***************************************************************************************************************

  var aoi2 = ee.Geometry(ee.FeatureCollection(aoi).geometry());
  var polygonArea = aoi2.area({'maxError': 1});
  polygonArea = (polygonArea.divide(10000).round()).getInfo();   // hectares approx
  //***************************************************************************************************************
  //  Adjusting Visualization Settings for the AOI
  //***************************************************************************************************************

  var scale;
  if(polygonArea < 2000 ){var scale = 10
  Map.centerObject(aoi, 14)}
  else if(polygonArea >= 2000 & polygonArea < 10000){
    scale = 50
    Map.centerObject(aoi, 12)}
  else if(polygonArea >= 10000 & polygonArea < 20000){
    scale = 100
    Map.centerObject(aoi, 10)}
  else if(polygonArea >= 10000 & polygonArea < 330000){
    scale = 100
    Map.centerObject(aoi, 8);
  }else if(polygonArea >= 330000 & polygonArea < 2200000){ 
    scale = 200
    Map.centerObject(aoi, 8);
  }else if(polygonArea >= 2200000 & polygonArea < 10000000){ 
    scale = 250
    Map.centerObject(aoi, 8);
  }else {scale = 250
  Map.centerObject(aoi, 6);}
  

  //***************************************************************************************************************
  //  FOREST MASK (None | WorldCover | DynamicWorld)
  //***************************************************************************************************************

  var ForestMasking = function(for_aoi, year, forestMaskSource, dwStart, dwEnd, treesOnly) {
    var fnf = ee.Image.constant(1).toByte().clip(for_aoi).selfMask().rename('FNF');
    if (forestMaskSource === 'None') return fnf;
    if (forestMaskSource === 'DynamicWorld') {
      var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
        .filterBounds(for_aoi)
        .filterDate(dwStart, dwEnd);
      var dwSize = dw.size();
      var forestMask = ee.Image(
        ee.Algorithms.If(
          dwSize.gt(0),
          dw.select('label').reduce(ee.Reducer.mode()).eq(1),
          ee.Image.constant(1)
        )
      ).rename('FNF');
      fnf = forestMask.selfMask().toByte().clip(for_aoi);
      return fnf;
    }
    return fnf;
  };
  var FNF = ForestMasking(aoi2, year, forestMaskSource, dwStart, dwEnd, treesOnly);
  //***************************************************************************************************************
  //  GEDI data
  //***************************************************************************************************************

  var dataset  = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY");
  var library2 = require("users/calvites1990/OF4D-GM:GEDI_source");

  var gedi = library2.ToGEDI(
    dataset,
    gedi_type,
    startDateGEDI,
    endDateGEDI,
    quantile,
    FNF,
    0.9,            // minSensitivity
    'full_power',   // beams_type
    'nighttime'     // shoot_time_type
  );

  //***************************************************************************************************************
  //  HLS / S2 composite
  //***************************************************************************************************************

  var library5 = require("users/calvites1990/OF4D-GM:hls_source");
  var s2_raw = library5.calculateCompositeClipHLS(year, start_date, end_date, cloudsTh, 20, FNF, aoi2, 'S30');
  var s2 = s2_raw.select(['B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B10','B11','B12']);

  //***************************************************************************************************************
  //  DEM + terrain
  //***************************************************************************************************************

  var dem = ee.Image('NASA/NASADEM_HGT/001').select('elevation').rename('elev');
  var hlsProj = s2.select('B2').projection();
  dem = dem.resample('bilinear').reproject(hlsProj);
  var slope  = ee.Terrain.slope(dem).rename('slope');
  var aspect = ee.Terrain.aspect(dem).rename('aspect');

  //***************************************************************************************************************
  //  Dataset merge
  //***************************************************************************************************************

  var latlon = ee.Image.pixelLonLat().select(['longitude', 'latitude']);

  var merged = s2
    .addBands(gedi)
    .addBands(dem)
    .addBands(slope)
    .addBands(aspect)
    .addBands(latlon);

  //***************************************************************************************************************
  //  Random sampling in large areas
  //***************************************************************************************************************

  var cellSize;
  if (scale === 100) {
    cellSize = 4000;
  } else {
    if (polygonArea < 5000) {
      cellSize = 100;
    } else if (polygonArea >= 5000 && polygonArea < 1000000) {
      cellSize = 4000;
    } else if (polygonArea >= 1000000 && polygonArea < 2000000) {
      cellSize = 6000;
    } else if (polygonArea >= 2000000 && polygonArea < 3000000) {
      cellSize = 6000;
    } else {
      cellSize = 50000;
    }
  }

  var libraryRS = require("users/calvites1990/OF4D-GM:library");
  var generatedPoints = libraryRS.generateSamplingSites(aoi2, cellSize, 1, FNF);
  var aoi_buffer = generatedPoints.buffer;
  var aoi_prova = aoi_buffer.geometry();

  //***************************************************************************************************************
  //  Sampling configuration
  //***************************************************************************************************************

var reference;
if (polygonArea <= 4000) {
  reference = merged.sample({
    region: aoi, 
    scale: 25,
    dropNulls: true,
    numPixels: 1e13, 
    tileScale: 4,
    seed: 0, 
    geometries: true
  });
} else {
  reference = merged.sample({
    region: ee.Geometry(aoi_prova),
    scale: scale,
    dropNulls: true,
    numPixels: 1e13,
    tileScale: 4, 
    seed: 0, 
    geometries: true
  });
}
 
  //***************************************************************************************************************
  //  Split train/validation
  //***************************************************************************************************************

  reference = reference.randomColumn('random');
  var split = 0.7;
  var training   = reference.filter(ee.Filter.lt('random', split));
  var validation = reference.filter(ee.Filter.gte('random', split));

  // ===== FIX 1: predictors WITHOUT the GEDI bands (no target leakage) =====
  var gediBands       = gedi.bandNames();                       // rh + any other GEDI metrics
  var predictorsNames = merged.bandNames().removeAll(gediBands);

  //***************************************************************************************************************
  //  Train model (RF)
  //***************************************************************************************************************

  var classifier;
  if (model === "RF") {
    classifier = ee.Classifier.smileRandomForest({
      numberOfTrees: ee.Number(numTreesRF)
    })
    .setOutputMode("Regression")
    .train(training, "rh", predictorsNames);
  }

  //***************************************************************************************************************
  //  Predict
  //***************************************************************************************************************

  var classified = merged.classify(classifier);
  classified = classified.updateMask(FNF);   // output masked to forest

  //***************************************************************************************************************
  //  Plots + variable importance
  //***************************************************************************************************************

  //var library4 = require("users/calvites1990/OF4D-GM:ForPlots");
  var trained   = training.classify(classifier);
  var validated = validation.classify(classifier);

  _clearFloatPanels();   // remove previous floating panels before drawing new ones

  // ---- TRAIN scatter, TEST scatter, and Variable Importance: ONE horizontal row, same size ----
  var makeScatter = function(fc, title) {
    var fcPlot = fc.filter(ee.Filter.notNull(['rh', 'classification'])).limit(5000);
    return ui.Chart.feature.byFeature(fcPlot, 'rh', ['classification'])
      .setChartType('ScatterChart')
      .setOptions({
        title: title || 'Predicted vs Observed GEDI metric',
        hAxis: {title: 'Observed GEDI metric (unit)'},
        vAxis: {title: 'Predicted GEDI metric (unit)'},
        pointSize: 3, dataOpacity: 0.4, legend: {position: 'none'},
        trendlines: {0: {showR2: true, visibleInLegend: true, color: 'red'}}
      });
  };

  // Variable importance chart (built here so it sits in the same row)
  var impDict = ee.Dictionary(classifier.explain().get('importance'));
  var impKeys = impDict.keys();
  var impVals = impDict.values(impKeys);
  var impFC = ee.FeatureCollection(
    impKeys.zip(impVals).map(function(pair){
      pair = ee.List(pair);
      return ee.Feature(null, {variable: ee.String(pair.get(0)),
                               importance: ee.Number(pair.get(1))});
    })
  ).sort('importance', false);

  var vimpChart = ui.Chart.feature.byFeature(impFC, 'variable', ['importance'])
    .setChartType('ColumnChart')
    .setOptions({
      title: 'Variable Importance Plot',
      hAxis: {title: 'Predictor Variables'},
      vAxis: {title: 'Importance'},
      legend: {position: 'none'},
      colors: ['1d6b99']
    });

  var scatterRow = ui.Panel({
    widgets: [
      makeScatter(trained,   'TRAIN — pred vs obs'),
      makeScatter(validated, 'TEST — pred vs obs'),
      vimpChart
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {
      position: 'bottom-center',
      padding: '2px',
      backgroundColor: 'rgba(255,255,255,0.85)',
      border: '1px solid black'
    }
  });
  // same dimensions for all three
  scatterRow.widgets().get(0).style().set({width: '320px', height: '210px'});
  scatterRow.widgets().get(1).style().set({width: '320px', height: '210px'});
  scatterRow.widgets().get(2).style().set({width: '320px', height: '210px'});
  Map.add(scatterRow);
  _floatPanels.push(scatterRow);

  //***************************************************************************************************************
  //  Model Performance — ONE computation feeds BOTH the on-screen window AND the CSV download
  //  (this guarantees the window and the downloaded table always show identical numbers)
  //***************************************************************************************************************

  var _statsOf = function(fc) {
    fc = fc.filter(ee.Filter.notNull(['rh','classification']));
    var obsMean = ee.Number(fc.aggregate_mean('rh'));
    var e = fc.map(function(f){
      var o = ee.Number(f.get('rh'));
      var p = ee.Number(f.get('classification'));
      var d = p.subtract(o);
      return f.set('err', d, 'abserr', d.abs(), 'sqerr', d.pow(2),
                   'sqtot', o.subtract(obsMean).pow(2));
    });
    var rmse = ee.Number(e.aggregate_mean('sqerr')).sqrt();
    var mae  = ee.Number(e.aggregate_mean('abserr'));
    var bias = ee.Number(e.aggregate_mean('err'));
    var sse  = ee.Number(e.aggregate_sum('sqerr'));
    var sst  = ee.Number(e.aggregate_sum('sqtot'));
    var r2   = ee.Number(1).subtract(sse.divide(sst));
    return ee.Dictionary({
      R2: r2, N: fc.size(),
      RMSE: rmse, RMSEr: rmse.divide(obsMean).multiply(100),
      MAE:  mae,  MAEr:  mae.divide(obsMean).multiply(100),
      Bias: bias, Biasr: bias.divide(obsMean).multiply(100)
    });
  };

  // Single server-side object holding BOTH train and test metrics
  var bothStats = ee.Dictionary({train: _statsOf(trained), test: _statsOf(validated)});

  // On-screen Model Performance window (top-right)
  var perfRows = ui.Panel({layout: ui.Panel.Layout.flow('vertical'), style: {margin: '0'}});
  var perfPanel = ui.Panel({
    widgets: [
      ui.Label('Model Performance', {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}),
      perfRows
    ],
    style: {position: 'top-right', width: '300px', padding: '8px',
            border: '2px solid black', backgroundColor: 'rgba(255,255,255,0.85)'}
  });
  Map.add(perfPanel);
  _floatPanels.push(perfPanel);

  // Download link (top-right, near the window)
  var metricsDownloadLabel = ui.Label('preparing metrics download...', {
    color: 'blue', textDecoration: 'underline', padding: '2px'
  });
  var metricsDownloadPanel = ui.Panel({
    widgets: [metricsDownloadLabel],
    style: {position: 'top-right', padding: '2px',
            backgroundColor: 'rgba(255,255,255,0.90)', border: '1px solid black'}
  });
  Map.add(metricsDownloadPanel);
  _floatPanels.push(metricsDownloadPanel);

  // ONE evaluation -> fill the window AND build the CSV from the SAME numbers
  bothStats.evaluate(function(res, err){
    if (err || !res) { metricsDownloadLabel.setValue('metrics error: ' + err); return; }
    var tr = res.train, te = res.test;

    function pct(v, p){ return Number(v).toFixed(2) + ' (' + Number(p).toFixed(1) + '%)'; }
    function padC(s, n){ s = String(s); var t = n - s.length, l = Math.floor(t/2);
      return Array(l+1).join(' ') + s + Array(t-l+1).join(' '); }
    function padL(s, n){ s = String(s); while (s.length < n) s = ' ' + s; return s; }
    function mono(text, bold){
      return ui.Label({value: text, style: {fontFamily: 'monospace', fontSize: '12px',
        whiteSpace: 'pre', fontWeight: bold ? 'bold' : 'normal', margin: '2px 0'}});
    }

    var COLM = 8, COLV = 14;
    var header = padC('Stats', COLM) + ' | ' + padC('Train', COLV) + ' | ' + padC('Test', COLV);

    perfRows.clear();
    perfRows.add(mono(header, true));
    perfRows.add(mono(Array(header.length + 1).join('-')));

    function row(name, vt, ve, bold){
      perfRows.add(mono(padC(name, COLM) + ' | ' + padL(vt, COLV) + ' | ' + padL(ve, COLV), bold));
    }

    row('R2',   Number(tr.R2).toFixed(3), Number(te.R2).toFixed(3), true);
    row('N',    String(tr.N),             String(te.N));
    row('RMSE', pct(tr.RMSE, tr.RMSEr),   pct(te.RMSE, te.RMSEr));
    row('MAE',  pct(tr.MAE,  tr.MAEr),    pct(te.MAE,  te.MAEr));
    row('Bias', pct(tr.Bias, tr.Biasr),   pct(te.Bias, te.Biasr));

    // CSV built from the SAME (already evaluated) numbers -> deterministic, matches the window
    var csvFC = ee.FeatureCollection([
      ee.Feature(null, {Stats:'R2',   Train: Number(tr.R2).toFixed(3),  Test: Number(te.R2).toFixed(3)}),
      ee.Feature(null, {Stats:'N',    Train: String(tr.N),              Test: String(te.N)}),
      ee.Feature(null, {Stats:'RMSE', Train: pct(tr.RMSE, tr.RMSEr),    Test: pct(te.RMSE, te.RMSEr)}),
      ee.Feature(null, {Stats:'MAE',  Train: pct(tr.MAE,  tr.MAEr),     Test: pct(te.MAE,  te.MAEr)}),
      ee.Feature(null, {Stats:'Bias', Train: pct(tr.Bias, tr.Biasr),    Test: pct(te.Bias, te.Biasr)})
    ]);

    csvFC.getDownloadURL('CSV', ['Stats','Train','Test'], 'OF4D_model_performance',
      function(url, e2){
        if (e2 || !url) { metricsDownloadLabel.setValue('metrics download error'); return; }
        metricsDownloadLabel.setValue('Download Model Performance (CSV)');
        metricsDownloadLabel.setUrl(url);
      });
  });

  //***************************************************************************************************************
  //  Visualization scaling
  //***************************************************************************************************************

  var max;
  if (gedi_type === 'singleGEDI') {
    max = 40;  libraryRS.scalecolor(0, max, classified);
  } else if (gedi_type === 'meanGEDI') {
    max = 40;  libraryRS.scalecolor(0, max, classified);
  } else if (gedi_type === 'pai') {
    max = 3;   libraryRS.scalecolor(0, max, classified);
  } else if (gedi_type === 'fhd_normal') {
    max = 2;   libraryRS.scalecolor(0, max, classified);
  } else if (gedi_type === 'cover') {
    max = 1;   libraryRS.scalecolor(0, max, classified);
  } else if (gedi_type === 'agbd') {
    max = 300; libraryRS.scalecolor(0, max, classified);
  }

  return [classified];
};

exports.GediMapper = GediMapper;

//***************************************************** End *****************************************************