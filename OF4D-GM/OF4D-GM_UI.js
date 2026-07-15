//-------------------------------------------------------------------------
// OpenForest4D GEDI Metrics - GEE web-based app
//-------------------------------------------------------------------------

// Draw AOI 
function drawCustomAoi(){
   while (Map.drawingTools().layers().length() > 0) {
    Map.drawingTools().layers().remove(Map.drawingTools().layers().get(0));
   }

// Hide the AOI layer once Run starts 
function styleAoiLayer() {
  if (Map.drawingTools().layers().length() > 0) {
     Map.drawingTools().layers().get(0).setColor('yellow');
  }
}

Map.drawingTools().onDraw(ui.util.debounce(styleAoiLayer, 300));
Map.drawingTools().onEdit(ui.util.debounce(styleAoiLayer, 300));
Map.drawingTools().setShape('polygon');
Map.drawingTools().setLinked(true);
Map.drawingTools().draw();
}

// load inputs
function loadInputs(){
  
var u_numTreesRF                 = numTreesRF                      .getValue();  
var u_year                       = YearTexbox                      .getValue();
var u_start_date                 = startDateTexbox                 .getValue();
var u_end_date                   = endDateTexbox                   .getValue();
var u_startDateGEDI              = startDateGEDITexbox             .getValue();
var u_endDateGEDI                = endDateGEDITexbox               .getValue();
var u_cloud_threshold            = cloudThresholdSlider            .getValue();
var u_TypePerc1                  = TypePercCheckbox1               .getValue();
var u_TypePerc2                  = TypePercCheckbox2               .getValue();
var u_TypePerc3                  = TypePercCheckbox3               .getValue();
var u_TypePerc4                  = TypePercCheckbox4               .getValue();
var u_TypePerc5                  = TypePercCheckbox5               .getValue();
var u_TypePerc6                  = TypePercCheckbox6               .getValue();
var u_choose_modelTexbox1        = choose_modelTexbox1             .getValue();
//
var u_forestMaskSource           = forestMaskSourceSelect          .getValue(); // 'None'|'WorldCover'|'DynamicWorld'
var u_dwStart                    = dwStartTexbox                   .getValue(); // 'YYYY-MM-DD'
var u_dwEnd                      = dwEndTexbox                     .getValue(); // 'YYYY-MM-DD'
var u_treesOnly                  = treesOnlyCheckbox               .getValue(); // true/false


var u_aoi = Map.drawingTools().layers().length() > 0
  ? Map.drawingTools().layers().get(0).getEeObject()
  : null;

u_year                  =  Number(u_year                  );
u_start_date            =  String(u_start_date            );
u_end_date              =  String(u_end_date              );
u_startDateGEDI         =  String(u_startDateGEDI         );
u_endDateGEDI           =  String(u_endDateGEDI           );
u_numTreesRF            =  Number(u_numTreesRF            ); 
u_cloud_threshold       =  Number(u_cloud_threshold       );
u_forestMaskSource       = String(u_forestMaskSource);
u_dwStart                = String(u_dwStart);
u_dwEnd                  = String(u_dwEnd);
u_treesOnly              = Boolean(u_treesOnly);

return { 
          u_aoi                      : u_aoi,              
          u_numTreesRF               : u_numTreesRF,       
          u_TypePerc1                : u_TypePerc1,       
          u_TypePerc2                : u_TypePerc2, 
          u_TypePerc3                : u_TypePerc3,       
          u_TypePerc4                : u_TypePerc4, 
          u_TypePerc5                : u_TypePerc5,  
          u_TypePerc6                : u_TypePerc6,  
          u_choose_modelTexbox1      : u_choose_modelTexbox1, 
          u_year                     : u_year,
          u_start_date               : u_start_date,
          u_end_date                 : u_end_date,
          u_startDateGEDI            : u_startDateGEDI,
          u_endDateGEDI              : u_endDateGEDI,
          u_cloud_threshold          : u_cloud_threshold,
          u_forestMaskSource         : u_forestMaskSource,
          u_dwStart                  : u_dwStart,
          u_dwEnd                    : u_dwEnd,
          u_treesOnly                : u_treesOnly
        };
}

// Maps each metric checkbox to the 'gedi_type' string GediMapper expects.

var METRIC_CHECKBOX_TABLE = null; // populated after the checkboxes are created (see below)
function getMetricCheckboxTable() {
  if (!METRIC_CHECKBOX_TABLE) {
    METRIC_CHECKBOX_TABLE = [
      {checkbox: TypePercCheckbox1, gediType: 'singleGEDI'},
      {checkbox: TypePercCheckbox2, gediType: 'meanGEDI'},
      {checkbox: TypePercCheckbox3, gediType: 'pai'},
      {checkbox: TypePercCheckbox4, gediType: 'fhd_normal'},
      {checkbox: TypePercCheckbox5, gediType: 'cover'},
      {checkbox: TypePercCheckbox6, gediType: 'agbd'}
    ];
  }
  return METRIC_CHECKBOX_TABLE;
}

// Shared handle to OF4D-GM_main.js - used by both map_gedi() (to run the
// model) and removeLayers() (to clear leftover floating panels on Reset).
var OF4D_GM_main = require("users/calvites1990/OF4D-GM:OF4D-GM_main");

// Run the model
function map_gedi() {

 var Inputs = loadInputs();
 var library  = OF4D_GM_main;

 // VALIDATE AOI + ALGORITHM SELECTION 
 if (!Inputs.u_aoi) {
  setErrorUI('Draw an area of interest on the map and run again');
  return;
}

if (!Inputs.u_choose_modelTexbox1) {
  setErrorUI('Select atleast one model (e.g. Random Forest) and run again');
  return;
}

// VALIDATE METRIC SELECTION (must be exactly one)

var checked = getMetricCheckboxTable().filter(function(row) {
  return row.checkbox.getValue();
});

if (checked.length === 0) {
  setErrorUI('Select atleast ONE forest metric and run again');
    return;
  }
 
 if (checked.length > 1) {
  setErrorUI('select only ONE forest metric (more than one is checked)');
  return;
}

var gediType = checked[0].gediType;

  // RUN THE MODEL
  // Hide the AOI outline now that its geometry has been captured into
  // Inputs.u_aoi above (It reappears automatically next time you draw or
  // reset the study area, since drawCustomAoi() always creates a fresh
  // drawing layer, which defaults to shown.)
  
  if (Map.drawingTools().layers().length() > 0) {
    Map.drawingTools().layers().get(0).setShown(false);
  }
  
  library.GediMapper(
    Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, Inputs.u_end_date,
    Inputs.u_startDateGEDI, Inputs.u_endDateGEDI, Inputs.u_cloud_threshold,
    null, // quantile: reserved for a future "custom Rh percentile" UI control
    'RF', gediType,
    Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
    Inputs.u_numTreesRF,
    function onModelReady(err, outputImage) {
      if (err) {
        setErrorUI('error: ' + err);
        return;
      }
      // The onReady callback below is what declares "Finished" once the async stats/download work settles. 
      // Buttons stay disabled (set by setRunningUI in the onClickhandler) until then.
      statusLabel.setValue('Status: Map generation - computing performance stats and preparing download links..');
    },
    function onReady(err) {
      if (err) {
        setErrorUI('Map added, but performance stats/downloads failed: ' + err);
        return;
      }
      setDoneUI('Finished - map, performance stats, and download links are all ready');
    }
  );
}


function removeLayers(){
  Map.clear();
  OF4D_GM_main.clearFloatPanels();
  drawCustomAoi();

  var widgets = ui.root.widgets();
  if (widgets.length()>3){
    ui.root.remove(ui.root.widgets().get(3));
  }
}

// Drawn study area
function drawNewStdyArea(){
  drawCustomAoi();
}
var color_selected = '#002b40';
var color_letter = 'white';
  
// Title
var Title = ui.Label({value: "OpenForest4D GEDI Forest Structure Maps", style:{
backgroundColor : color_selected, textAlign: "center" , color: color_letter, fontSize: "24px"}});

// Subtitle
var Subtitle = ui.Label({value: "Web application generates wall-to-wall forest structure maps from NASA GEDI lidar, combined with optical satellite imagery and machine learning.", style:{backgroundColor : color_selected, fontWeight: 'normal', fontSize: '14px',color:"#dedede"}});

var spatialExtenttitle = ui.Label({value: "1. Select spatial area of interest (map toolbar)", style:{
backgroundColor : color_selected, fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var datasettingtitle = ui.Label({value: "2. Data selections", style:{
backgroundColor : color_selected, fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var modelsettingtitle = ui.Label({value: "3. Algorithm selection", style:{
backgroundColor : color_selected, fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

// Year for Collecting images
var YearTexbox = ui.Select({
  items: [
                  {label: '2017',    value: "2017"},
                  {label: '2018',    value: "2018"},
                  {label: '2019',    value: "2019"},
                  {label: '2020',    value: "2020"},
                  {label: '2021',    value: "2021"},
                  {label: '2022',    value: "2022"},
                  {label: '2023',    value: "2023"},
                  {label: '2024',    value: "2024"}
                  ],style: {color: '#333333',width: '70px',height: '30px', border: '2px solid darkgray'}}).setValue("2019");

// Start date for Collecting images
var startDateTexbox = ui.Textbox({
placeholder: 'startDate (e.g. 03-01)',value: '03-01',
style: {width: '70px',height: '30px',color: '#333333',border: '2px solid darkgray'}});

// End date for Collecting images
var endDateTexbox = ui.Textbox({
placeholder: 'endDate (e.g. 08-31)',value: '08-31',
style: {width: '70px',height: '30px',color: '#333333',border: '2px solid darkgray'}});

//Dates for collecting GEDI footprints

var startDateGEDITexbox = ui.Textbox({
placeholder: 'startDate (e.g. 2019-01-01)',value: '2019-01-01',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray',backgroundColor:color_selected}});

// End date for Collecting images
var endDateGEDITexbox = ui.Textbox({
placeholder: 'endDate (e.g. 2019-12-31)',value: '2020-12-31',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray',backgroundColor:color_selected}});

// GEDI footprints collection
var Label_GEDI= ui.Label({value: "GEDI footprints temporal extents",style:{backgroundColor:color_selected, shown: true, fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"   }});

// Hyperparameters for ML algorithms 
var Label_numTreesRF    =  ui.Label({value: "Number of trees", 
style:{width: '100px', backgroundColor : color_selected, color: "white", shown: true, fontFamily: "sans-serif"}});
var numTreesRF  = ui.Textbox({ placeholder: 'numberOfTrees',value: '200',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});

var footer = ui.Label({value: "Developed as part of the OpenForest4D project at the University of Florida.", style:{backgroundColor : color_selected, textAlign: "center", fontWeight: 'normal', fontSize: '14px',color:"#dedede"}});

// RUN STATUS + PROGRESS BAR
var statusLabel = ui.Label({
  value: 'Status: ready.',
  style: {
    shown: true,
    backgroundColor: color_selected,
    color: 'white',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontSize: '14px',
    padding: '6px',
    margin: '6px 0 0 0'
  }
});

// Indeterminate progress (no % in Earth Engine)
var progressBar = ui.Label({
  value: 'Processing…',
  style: {
    shown: false,
    backgroundColor: color_selected,
    color: '#FFFF33',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontSize: '14px',
    padding: '6px',
    margin: '6px 0 0 0'
  }
});

function setRunningUI(msg) {
  statusLabel.setValue('Status: ' + msg);
  progressBar.style().set('shown', true);
  runGEDIMetrics.setDisabled(true);
  removeLayersButton.setDisabled(true);
}

function setDoneUI(msg) {
  statusLabel.setValue('Status: ' + msg);
  progressBar.style().set('shown', false);
  runGEDIMetrics.setDisabled(false);
  removeLayersButton.setDisabled(false);
}

function setErrorUI(msg) {
  statusLabel.setValue('Status: ' + msg);
  progressBar.style().set('shown', false);
  runGEDIMetrics.setDisabled(false);
  removeLayersButton.setDisabled(false);
}

// Define Cloud Threshold Slider Button
var cloudThresholdSlider    =  ui.Slider({min: 0, max: 100, value:35, step: 1,
                            style:{backgroundColor : color_selected, shown: true, 
                              fontWeight: 'bold', fontSize: '18px',color: "white" , width:'200px' }});
var cloudThresholdLabel     =  ui.Label({value: "Maximum allowed cloud cover (%)", 
                            style:{backgroundColor : color_selected, shown: true,
                              fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
                              
// Check boxes onChange GEDI metrics
var TypePercCheckbox1 = ui.Checkbox({label: 'Top-of-Canopy Height (m)',value: true, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox2 = ui.Checkbox({label: 'Maximum Canopy Height (m)',value: false, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox3 = ui.Checkbox({label: 'Plant Area Index (m²/m²)',value: false, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox4 = ui.Checkbox({label: 'Foliage Height Diversity (Unitless)',value: false, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox5 = ui.Checkbox({label: 'Canopy Cover (fraction, 0–1)',value: false, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox6 = ui.Checkbox({label: 'Aboveground biomass density (Mg/ha)',value: false, style:{shown: true, 
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});

// ---- Enforce single-select behaviour: checking one metric unchecks the others. ----
var allMetricCheckboxes = [
  TypePercCheckbox1, TypePercCheckbox2, TypePercCheckbox3,
  TypePercCheckbox4, TypePercCheckbox5, TypePercCheckbox6
];
function makeMetricExclusive(box) {
  box.onChange(function(checked) {
    if (checked) {
      allMetricCheckboxes.forEach(function(other) {
        if (other !== box) other.setValue(false, false); // false = don't fire onChange
      });
    }
  });
}
allMetricCheckboxes.forEach(makeMetricExclusive);

// Check boxes onChange ML algorithms
var GeneralModelCheckbox = ui.Checkbox({label: 'AI/ML based model', value: true, 
style:{shown: true, backgroundColor : color_selected, fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});

GeneralModelCheckbox.onChange(function(checked){   
    if(checked){
      secondpanel3.style().set('shown', true); 
    }
    else {
      secondpanel3.style().set('shown', false);
    }
});

// Advanced options panel
var secondpanel3 = ui.Panel({style: {width: '100%', backgroundColor: color_selected,
 textAlign: "center", whiteSpace: "nowrap",shown: true }});

var choose_modelTexbox1 = ui.Checkbox({label: 'Random Forests (RF)', value: true, style:{shown: true,
 backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});

// Download maps
choose_modelTexbox1.onChange(function(checked){   
                         if(checked){
                           secondpanel4.style().set('shown', true); 
                         }
                         else {
                           secondpanel4.style().set('shown', false);
                         }
                       });

var secondpanel4 = ui.Panel({style: {width: '100%', backgroundColor: color_selected,
  textAlign: "center", whiteSpace: "nowrap",shown: true }});

var Label_RemoteSensing    =  ui.Label({value: "Satellite image date range", 
                            style:{backgroundColor : color_selected, shown: true, 
                              fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"   }});


// GEDI metrics setting 
var GeneralTypePercCheckbox = ui.Checkbox({label: ' Forest structural metric', value: false, style:{shown: true,
  backgroundColor : color_selected, fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});

GeneralTypePercCheckbox.onChange(function(checked){   
                         if(checked){
                           secondpanel2.style().set('shown', true); 
                         }
                         else {
                           secondpanel2.style().set('shown', false);
                         }
                       });
var secondpanel2 = ui.Panel({style: {width: '100%', backgroundColor: color_selected,
  textAlign: "center", whiteSpace: "nowrap",shown: false }});
 
// Global panel
var panel = ui.Panel({style: {width: '25%', backgroundColor: color_selected, 
border: '1px solid black', padding: "8px", textAlign: "left", whiteSpace: "pre-wrap", shown: true}});

// Horizontal panels
var AAHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var BBHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var KKHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var ZZHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});


// Run boxes
var runGEDIMetrics = ui.Button({
      label: 'Run',style: {color: '#333333',border: '3px solid darkgray'}});
     runGEDIMetrics.onClick(function () {
  setRunningUI('running… please wait');
 
  ui.util.setTimeout(function () {
    try {
      map_gedi();
    } catch (e) {
      setErrorUI('error: ' + e);
    }
  }, 10);
});

var removeLayersButton = ui.Button({
      label: 'Reset',style: {color: '#D62F2B',border: '3px solid darkgray'}});
removeLayersButton.onClick(removeLayers);
var runDrawNewStdyArea = ui.Button({
      label: 'Reset study area',
       onClick: drawNewStdyArea,
      style: {shown: false,color: '#D62F2B',border: '3px solid darkgray'}
 }); 

var color_selected = '#002b40';
var color_letter = 'white';

// Links
var documentationLabel = ui.Label({
  value: 'Documentation and source code',
  targetUrl: 'https://github.com/OpenForest4D/gedi-forest-structure-gee-app/',
  style: {
    fontSize: '16px',
    color: '#43A5BE',
    fontFamily: 'sans-serif',
    padding: '4px',
    backgroundColor : color_selected
  }
});
//
var acknowledgement = ui.Label(
  "OpenForest4D is funded by NSF awards 2409885, 2409886 & 2409887",
  {
    backgroundColor: color_selected,
    fontWeight: "bold",
    fontSize: "14px",
    color:"#dedede",
    textAlign: "center", 
    whiteSpace: 'pre-wrap',
    padding: "8px",
    margin: "6px 0 0 0"
    
  }
);

// Forest mask inputs
var forestMaskSourceSelect = ui.Select({
  items: [
    {label: 'None',         value: 'None'},
    {label: 'DynamicWorld', value: 'DynamicWorld'}
  ],
  value: 'None',
  style: {color: '#333333', border: '2px solid darkgray', width: '200px', height: '30px'}
});

var forestMaskSourceLabel = ui.Label({
  value: "Forest mask source",
  style: {backgroundColor: color_selected, shown: true,
          fontWeight: 'bold', fontSize: '18px', color: "#43A5BE"}
});

// Dynamic World time range (shown only if DynamicWorld)
var dwStartTexbox = ui.Textbox({
  placeholder: 'DW start (YYYY-MM-DD)',
  value: '2019-01-01',
  style: {width: '110px', height: '30px', color: '#333333',
          border: '2px solid darkgray', backgroundColor: color_selected, shown: false}
});

var dwEndTexbox = ui.Textbox({
  placeholder: 'DW end (YYYY-MM-DD)',
  value: '2020-01-01',
  style: {width: '110px', height: '30px', color: '#333333',
          border: '2px solid darkgray', backgroundColor: color_selected, shown: false}
});

var dwRangeLabel = ui.Label({
  value: "Dynamic World date range",
  style: {backgroundColor: color_selected, shown: false,
          fontWeight: 'bold', fontSize: '18px', color: "#43A5BE"}
});

var dwHorizontalPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '100%', backgroundColor: color_selected, border: 'none', textAlign: "center",
          whiteSpace: "nowrap", shown: false}
});
dwHorizontalPanel.add(dwStartTexbox);
dwHorizontalPanel.add(dwEndTexbox);

// Trees only (default TRUE)
var treesOnlyCheckbox = ui.Checkbox({
  label: 'Trees only',
  value: true,
  style: {shown: false, backgroundColor: color_selected, color: "white",
          fontSize: "16px", fontFamily: "sans-serif"}
});

// Show/hide DW widgets based on forestMaskSource
function _toggleDWWidgets() {
  var v = forestMaskSourceSelect.getValue();
  var showDW = (v === 'DynamicWorld');

  dwRangeLabel.style().set('shown', showDW);
  dwHorizontalPanel.style().set('shown', showDW);
  dwStartTexbox.style().set('shown', showDW);
  dwEndTexbox.style().set('shown', showDW);
  treesOnlyCheckbox.style().set('shown', showDW);

// keep treesOnly = true by default (you can allow user to change)
if (showDW && treesOnlyCheckbox.getValue() !== true) {
    // optional: enforce true if you want:
    // treesOnlyCheckbox.setValue(true);
  }
}
forestMaskSourceSelect.onChange(_toggleDWWidgets);
_toggleDWWidgets();

// -------------------- Initialize AOI drawing (Step 1, Draw-only) --------------------
// Runs once, after every widget referenced here (runDrawNewStdyArea) has been defined above.
function initializeAoiDrawing() {
  runDrawNewStdyArea.style().set('shown', true);
  Map.drawingTools().setShape(null);
  drawCustomAoi();
}
initializeAoiDrawing();

// Final boxes 
// ********  MAIN INFORMATION *********
panel.add(Title);
panel.add(Subtitle);
panel.add(documentationLabel);
panel.add(spatialExtenttitle);
panel.add(runDrawNewStdyArea); 
// ********  DATA SETTING *********
panel.add(datasettingtitle);
// ******** FOREST MASK ***********
panel.add(forestMaskSourceLabel);
panel.add(forestMaskSourceSelect);
panel.add(dwRangeLabel);
panel.add(dwHorizontalPanel);
panel.add(treesOnlyCheckbox);
// ********  GEDI METRICS *********
secondpanel2.add(TypePercCheckbox1);
secondpanel2.add(TypePercCheckbox2);
secondpanel2.add(TypePercCheckbox3);
secondpanel2.add(TypePercCheckbox4);
secondpanel2.add(TypePercCheckbox5);
secondpanel2.add(TypePercCheckbox6);
panel.add(GeneralTypePercCheckbox);
panel.add(secondpanel2);
// ********  SET GEDI COLLECTION *********
panel.add(Label_GEDI);
panel.add(ZZHorizontalPanel);
ZZHorizontalPanel.add(startDateGEDITexbox);
ZZHorizontalPanel.add(endDateGEDITexbox);
//********* SET PARAMS FOR PREDICTORS *****
panel.add(Label_RemoteSensing);
panel.add(KKHorizontalPanel);
KKHorizontalPanel.add(YearTexbox);
KKHorizontalPanel.add(startDateTexbox);
KKHorizontalPanel.add(endDateTexbox);
panel.add(cloudThresholdLabel);
panel.add(cloudThresholdSlider);
//********* Model settings *************
panel.add(modelsettingtitle);
// ********  SET RANDOM FORESTS *********
secondpanel3.add(choose_modelTexbox1) 
secondpanel4.add(AAHorizontalPanel) 
AAHorizontalPanel.add(Label_numTreesRF)
secondpanel4.add(BBHorizontalPanel)
BBHorizontalPanel.add(numTreesRF)
secondpanel3.add(secondpanel4) 
// ********  CHOOSE MACHINE LEARNING *********
panel.add(GeneralModelCheckbox);
panel.add(secondpanel3)
// ***************  PANEL ********************
panel.add(statusLabel);
panel.add(progressBar);
// ***************  run ********************
panel.add(runGEDIMetrics);
panel.add(removeLayersButton);
panel.add(footer);
panel.add(acknowledgement);
{
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));  
ui.root.insert(0, panel);  
}
