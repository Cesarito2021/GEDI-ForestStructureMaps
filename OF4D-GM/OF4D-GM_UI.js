//*****************************************************************************************************************************
//*************************************  OpenForest4D GEDI Metrics - GEE web-based app  ***************************************
//*****************************************************************************************************************************
//*****************************************************************************************************************************

// Draw AOI 
function drawCustomAoi(){
   while (Map.drawingTools().layers().length() > 0) {
    Map.drawingTools().layers().remove(Map.drawingTools().layers().get(0));
   }
   function f() {}
 Map.drawingTools().onDraw(ui.util.debounce(f, 500));
 Map.drawingTools().setShape('polygon');
 Map.drawingTools().setLinked(true);
 Map.drawingTools().draw();
}
// load inputs
function loadInputs(){
  
var u_chooseAoi                  = chooseAoiCheckSelector          .getValue();
var u_aoiShp                     = aoiShpTexbox                    .getValue();  
var u_numTreesRF                 = numTreesRF                      .getValue();  
var u_choose_mask3               = selectmask3                     .getValue();  
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
var u_outputImgName              = u_outputImgNameTexbox           .getValue();
var u_DownloadOutput             = u_DownloadOutputCheckbox        .getValue();
var u_outputFolder               = u_outputFolderTexbox            .getValue();
//
var u_forestMaskSource           = forestMaskSourceSelect          .getValue(); // 'None'|'WorldCover'|'DynamicWorld'
var u_dwStart                    = dwStartTexbox                   .getValue(); // 'YYYY-MM-DD'
var u_dwEnd                      = dwEndTexbox                     .getValue(); // 'YYYY-MM-DD'
var u_treesOnly                  = treesOnlyCheckbox               .getValue(); // true/false

// adjust inputs
var u_aoi;
if (u_chooseAoi == 'Draw'){
  u_aoi = Map.drawingTools().layers().get(0).getEeObject();
}else if (u_chooseAoi == 'Boundary'){
  u_aoi = ee.FeatureCollection(u_aoiShp);}

u_year                  =  Number(u_year                  );
u_start_date            =  String(u_start_date            );
u_end_date              =  String(u_end_date              );
u_startDateGEDI         =  String(u_startDateGEDI         );
u_endDateGEDI           =  String(u_endDateGEDI           );
u_numTreesRF            =  Number(u_numTreesRF            ); 
u_cloud_threshold       =  Number(u_cloud_threshold       );
u_outputImgName         =  String(u_outputImgName         ); 
u_outputFolder          =  String(u_outputFolder          ); 
u_forestMaskSource       = String(u_forestMaskSource);
u_dwStart                = String(u_dwStart);
u_dwEnd                  = String(u_dwEnd);
u_treesOnly              = Boolean(u_treesOnly);

  return { 
          u_chooseAoi                : u_chooseAoi,        
          u_aoi                      : u_aoi,              
          u_numTreesRF               : u_numTreesRF,       
          u_choose_mask3             : u_choose_mask3,    
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
          u_outputImgName            : u_outputImgName,
          u_DownloadOutput           : u_DownloadOutput, 
          u_outputFolder             : u_outputFolder,
          u_forestMaskSource         : u_forestMaskSource,
          u_dwStart                  : u_dwStart,
          u_dwEnd                    : u_dwEnd,
          u_treesOnly                : u_treesOnly
          };
}
// 
var downloadUrl = null;
// ===== Tile-click download state (global) =====
var lastOutputImage = null;  // ee.Image of the latest GEDI metric map
var lastAOI = null;          // ee.Geometry of AOI
var tileGrid = ee.FeatureCollection('projects/ee-calvites1990/assets/usa_grid_10km_5070'); // has grid_id

//
function refreshGridForAOI(aoiGeom) {
  var tiles = tileGrid.filterBounds(aoiGeom);

  tileGridLayer.setEeObject(tiles.style({
    color: 'FFFFFF',
    fillColor: '00000000',
    width: 2
  }));

  // opzionale: zoom sull'AOI
  Map.centerObject(aoiGeom, 9);
}

// Run the model
function map_gedi() {

  var Inputs = loadInputs();
  var library  = require("users/calvites1990/OF4D-GM:OF4D-GM_main");
  var library5 = require("users/calvites1990/OF4D-GM:library");  // optional drive export

  var outputImage = null;   // ee.Image
  var gediType = null;      // string metric type

  // -------------------- CHOOSE AOI MODE --------------------
  if (Inputs.u_chooseAoi == "Draw") {

    if (Inputs.u_choose_modelTexbox1) {

      if (Inputs.u_TypePerc1) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'singleGEDI',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'singleGEDI';

      } else if (Inputs.u_TypePerc2) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'meanGEDI',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'meanGEDI';

      } else if (Inputs.u_TypePerc3) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'pai',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'pai';

      } else if (Inputs.u_TypePerc4) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'fhd_normal',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'fhd_normal';

      } else if (Inputs.u_TypePerc5) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'cover',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'cover';

      } else if (Inputs.u_TypePerc6) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'agbd',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'agbd';
      }
    }

  } else if (Inputs.u_chooseAoi == "Boundary") {

    if (Inputs.u_choose_modelTexbox1) {

      if (Inputs.u_TypePerc1) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'singleGEDI',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'singleGEDI';

      } else if (Inputs.u_TypePerc2) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'meanGEDI',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'meanGEDI';

      } else if (Inputs.u_TypePerc3) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'pai',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'pai';

      } else if (Inputs.u_TypePerc4) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'fhd_normal',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'fhd_normal';

      } else if (Inputs.u_TypePerc5) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'cover',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'cover';

      } else if (Inputs.u_TypePerc6) {
        outputImage = library.GediMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,
          Inputs.u_end_date, Inputs.u_startDateGEDI, Inputs.u_endDateGEDI,
          Inputs.u_cloud_threshold, Inputs.u_quantile,
          'RF', 'none', 'agbd',Inputs.u_forestMaskSource, Inputs.u_dwStart, Inputs.u_dwEnd, Inputs.u_treesOnly,
          Inputs.u_numTreesRF,'NULL','NULL','NULL','NULL',
          Inputs.u_numTreesGBM, Inputs.u_shrGBM, Inputs.u_samLingRateGBM, Inputs.u_maxNodesGBM,
          Inputs.u_lossGBM, Inputs.u_maxNodesCART, Inputs.u_minLeafPopCART);
        gediType = 'agbd';
      }
    }
  }

  // -------------------- VALIDATION / SAVE OUTPUT --------------------
  if (!outputImage || !gediType) {
    setErrorUI('select ONE forest metric and run again ❌');
    return;
  }

  //enableValueInspector(outputImage, gediType, {scale: 30});

  // Save latest output for tile-click download
  lastOutputImage = ee.Image(outputImage);
  lastAOI = ee.FeatureCollection(Inputs.u_aoi).geometry();
  
  refreshGridForAOI(lastAOI);

  // Optional: if you still want Drive export, keep this.
  // If you want ONLY tile-click downloads, comment this block.
  if (Inputs.u_DownloadOutput) {
    library5.DownloadImg(outputImage, Inputs.u_outputImgName, Inputs.u_outputFolder, Inputs.u_aoi);
  }

  statusLabel.setValue('Status: map ready ✅ — click a grid tile to download');
  setDoneUI('ready for tile download');
}

//function removeLayers(){
//  Map.clear();
//  var widgets = ui.root.widgets();
//  if (widgets.length()>3){
//  ui.root.remove(ui.root.widgets().get(3));
//  }
//}
function removeLayers(){
  Map.clear();

  // re-add grid layers after clear
  Map.layers().add(tileGridLayer);
  Map.layers().add(selectedTileLayer);

  tileLabel.setValue('Tile: —');
  tileDownloadLabel.style().set('shown', false);

  var widgets = ui.root.widgets();
  if (widgets.length()>3){
    ui.root.remove(ui.root.widgets().get(3));
  }
}

//  ********************************* Drawn study area  **********************************
function drawNewStdyArea(){
  if(Map.drawingTools().layers().length() > 0){
    drawCustomAoi()
    }
  }
var color_selected = '#002b40';
var color_letter = 'white';
  
//  *********************************  Title  **********************************
var Title = ui.Label({value: "                 GEDI Forest Structure Maps", style:{
backgroundColor : color_selected, textAlign: "center" , color: color_letter, fontSize: "22px", fontFamily: "sans-serif"}});
//  ********************************* Subtitle  **********************************
var Subtitle = ui.Label({value: "--------------------------------------------", style:{
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var spatialExtenttitle = ui.Label({value: "STEP 1 — Select the spatial area of interest", style:{
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var datasettingtitle = ui.Label({value: "STEP 2 — Data settings", style:{
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var modelsettingtitle = ui.Label({value: "STEP 3 — Model Settings", style:{
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var downloadsettingtitle = ui.Label({value: "STEP 4 — Results & Download", style:{
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

//  ***************************** Text for AOI polygon ******************************  
var aoiShpTexbox = ui.Textbox({
  placeholder: 'Area Of Interest (shp)',
  value: 'projects/ee-calvites1990/assets/Hurricane_Michael',
  style: {shown: false, width: '335px',color: '#333333',border: '1px solid darkgray'}
});
//  *********************************   AOI upload   *********************************  
var chooseAoiCheckSelector = ui.Select({
 items: [
   {label: 'Draw Area Of Interest (AOI) - Geometry tools'  , value: "Draw"    },
   {label: 'Upload Area Of Interest (AOI) - Shapefile format '    , value: "Boundary"}],
style: {color: '#333333',border: '2px solid darkgray',width: '250px',height: '30px',fontWeight: 'bold', fontSize: '20px'}
   }).setValue("Draw");
//  *********************************    color: color_letters map    ***************************
var u_DownloadOutputCheckbox = ui.Checkbox({
  label:'Download forest structure Map', value:false, style:{shown: true,
  backgroundColor : color_selected, fontFamily: "sans-serif", fontWeight: 'bold', fontSize: '18px',color: "#43A5BE" }});
//  *********************************   Forest Masks    *******************************
var u_MaskCheckbox = ui.Checkbox({
  label:'Toggle Forest Mask', 
  value:false, style:{shown: true,backgroundColor : color_selected, color:"#43A5BE", fontSize: "18px", fontFamily: "sans-serif"}});
 //
  chooseAoiCheckSelector.onChange(function(aoiOption){   
                         if(aoiOption == "Draw"){
                           aoiTexbox.style().set('shown', true);
                           aoiTexbox.setValue('Draw');
                           u_DownloadOutputCheckbox.style().set('shown', true); 
                           u_DownloadOutputCheckbox.setValue(false); 
                           runDrawNewStdyArea.style().set('shown', true);
                           Map.drawingTools().setShape(null);
                           drawCustomAoi();
                         }
                        if(aoiOption == "Boundary"){
                           aoiShpTexbox.style().set('shown', true);
                           aoiShpTexbox.setValue('projects/ee-calvites1990/assets/Hurricane_Michael');
                           u_MaskCheckbox.style().set('shown', true); //*
                           u_MaskCheckbox.setValue(false); 
                           u_DownloadOutputCheckbox.style().set('shown', true); //*
                           u_DownloadOutputCheckbox.setValue(false); 
                           runDrawNewStdyArea.style().set('shown', true);
                           Map.drawingTools().setShape(null);
                           }})
//  *********************************   Year for Collecting images    *******************************
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
//  *********************************   Start date for Collecting images    *******************************
var startDateTexbox = ui.Textbox({
placeholder: 'startDate (e.g. 03-01)',value: '03-01',
style: {width: '70px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//  *********************************   Ends date for Collecting images    *******************************
var endDateTexbox = ui.Textbox({
placeholder: 'endDate (e.g. 08-31)',value: '08-31',
style: {width: '70px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//*********************************************************************************************************
//************************************  Data for collecting GEDI footprints *******************************
//*********************************************************************************************************
var startDateGEDITexbox = ui.Textbox({
placeholder: 'startDate (e.g. 2019-01-01)',value: '2019-01-01',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray',backgroundColor:color_selected}});
//  *********************************   Ends date for Collecting images    ********************************
var endDateGEDITexbox = ui.Textbox({
placeholder: 'endDate (e.g. 2019-12-31)',value: '2020-12-31',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray',backgroundColor:color_selected}});
//  *********************************   GEDI footprints collection    *************************************
var Label_GEDI= ui.Label({value: "GEDI footprints temporal extents",style:{backgroundColor:color_selected, shown: true, fontFamily: "sans-serif", fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"   }});
//*********************************************************************************************************
//************************************  Hyperparameters for ML algorithms  ********************************
//*********************************************************************************************************
var Label_numTreesRF    =  ui.Label({value: "numberOfTrees", 
style:{width: '100px', backgroundColor : color_selected, color: "white", shown: true, fontFamily: "sans-serif"}});
var numTreesRF  = ui.Textbox({ placeholder: 'numberOfTrees',value: '200',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//********************************************************************************************************
//***********************************  Download maps      ************************************************
//********************************************************************************************************
var u_outputFolderTexbox = ui.Textbox({                                
  placeholder: 'Output img folder name  (e.g. out)',                              
  value: 'ee_drive',
  style: {width: '155px', shown: false}});
var u_outputImgNameTexbox = ui.Textbox({
  placeholder: 'Output img name  (e.g. out)',
  value: 'OF4D-GM',
  style: {width: '155px', shown: false}});
 //  *********************************     Folder label maps      ****************************************
 var outputFolderLabel = ui.Label({value: "Google Drive folder name", style:{
   shown: false, backgroundColor : color_selected, color: "white"}});
 var outputImgNameLabel = ui.Label({value: " Name of File (GeoTIFF) ", style:{
  shown: false,backgroundColor : color_selected, color: "white"}});
 //  *********************************     Download maps      ********************************************
 u_DownloadOutputCheckbox.onChange(function(checked){  
   if(checked){
     u_outputImgNameTexbox.style().set('shown', true);
     outputImgNameLabel.style().set('shown', true);
     //
     u_outputFolderTexbox.style().set('shown', true);
     outputFolderLabel.style().set('shown', true);
   }else{
     u_outputImgNameTexbox.style().set('shown', false);
     outputImgNameLabel.style().set('shown', false);
     //
     u_outputFolderTexbox.style().set('shown', false);                    
    outputFolderLabel.style().set('shown', false);                       
   }
 });
 //  *********************************  Url Download  **********************************
  var urlLabel = ui.Label({
    value: 'Download your image here',
    style: {color: 'blue', textDecoration: 'underline', shown: false}
  })
 //********************************************************************************************************
 //********************************* progress bar         *************************************************
//********************************************************************************************************
 // ====================== RUN STATUS + PROGRESS BAR ======================
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
// "Progress" indeterminato (GEE non supporta % reale)
var progressBar = ui.Label({
  value: '⏳ Processing…',
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
//********************************************************************************************************
 //********************************* progress bar         *************************************************
//********************************************************************************************************

 //  *****************************     Define Slider buttom     ********************************************
var cloudThresholdSlider    =  ui.Slider({min: 0, max: 100, value:70, step: 1,
                            style:{backgroundColor : color_selected, shown: true, fontFamily: "sans-serif", 
                              fontWeight: 'bold', fontSize: '18px',color: "white" , width:'200px' }});
var cloudThresholdLabel     =  ui.Label({value: "Maximum allowed cloud cover (%)", 
                            style:{backgroundColor : color_selected, shown: true, fontFamily: "sans-serif", 
                              fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
//*********************************************************************************************************
//************************************   Check boxes onChange Forest Mask  ********************************
//*********************************************************************************************************
var selectmask3 = ui.Checkbox({label: 'Exclude Forest Mask', value: false, style:{shown: true,
  backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
//*********************************************************************************************************
//************************************   Check boxes onChange GEDI metrics ********************************
//*********************************************************************************************************
var TypePercCheckbox1 = ui.Checkbox({label: 'Top-of-Canopy Height (m)',value: true, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox2 = ui.Checkbox({label: 'Maximum Canopy Height (m)',value: false, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox3 = ui.Checkbox({label: 'Plant Area Index (m²/m²)',value: false, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox4 = ui.Checkbox({label: 'Foliage Height Diversity (Unitless)',value: false, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox5 = ui.Checkbox({label: 'Canopy Cover (fraction, 0–1)',value: false, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
var TypePercCheckbox6 = ui.Checkbox({label: 'Aboveground biomass density (Mg/ha)',value: false, style:{shown: true, // it was avg
backgroundColor : color_selected, color: "white", fontSize: "16px", fontFamily: "sans-serif"}});
///*********************************************************************************************************
//******************************** Check boxes onChange ML algorithms  *************************************
///*********************************************************************************************************
var GeneralModelCheckbox = ui.Checkbox({label: 'AI-based algorithm', value: false, 
style:{shown: true, backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
//
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
 textAlign: "center", whiteSpace: "nowrap",shown: false }});
// *********************************************************************************************************
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
 textAlign: "center", whiteSpace: "nowrap",shown: false }});
// ********************************************************************************************************
var Label_RemoteSensing    =  ui.Label({value: "Satellite image date range", 
                            style:{backgroundColor : color_selected, shown: true, fontFamily: "sans-serif", 
                              fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"   }});

///*********************************************************************************************************
//********************************   GEDI metrics setting    ***********************************************
///*********************************************************************************************************
var GeneralTypePercCheckbox = ui.Checkbox({label: ' Forest structural metric', value: false, style:{shown: true,
backgroundColor : color_selected, fontFamily: "sans-serif",fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
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
///*********************************************************************************************************
//*************************************   Global panel   ***************************************************
///*********************************************************************************************************
var panel = ui.Panel({style: {width: '25%', backgroundColor: color_selected, 
border: '1px solid black', textAlign: "center", whiteSpace: "nowrap", shown: true}});
// ===== Show download grid on map + highlight selected tile =====
var tileGridLayer = ui.Map.Layer(tileGrid.style({
  color: '00000000',
  fillColor: '00000000',
  width: 1.5
}), {}, 'Download grid', true);
Map.layers().add(tileGridLayer);

// Selected tile highlight
var selectedTileLayer = ui.Map.Layer(ee.Image().paint(ee.Geometry.Point([0,0]), 0), {}, 'Selected tile', false);
Map.layers().add(selectedTileLayer);
// ======================================================
// CLICK TILE -> genera URL di download della tile (GEDI output)
// ======================================================
Map.onClick(function(coords) {
  // se non hai runnato ancora, non puoi scaricare
  if (!lastOutputImage || !lastAOI) {
    statusLabel.setValue('Status: run the model first, then click a tile ❗');
    tileDownloadLabel.style().set('shown', false);
    return;
  }
  tileDownloadLabel.style().set('shown', false);
  statusLabel.setValue('Status: selecting tile…');
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  // prendo la tile cliccata (sulla griglia filtrata dall'AOI)
  var cell = tileGrid.filterBounds(lastAOI).filterBounds(pt).first();
  cell.evaluate(function(cellClient) {
    if (!cellClient) {
      statusLabel.setValue('Status: no tile here (outside AOI grid) ❌');
      tileLabel.setValue('Tile: —');
      return;
    }
    var cellFeat = ee.Feature(cell);
    var cellGeom = cellFeat.geometry();

    // highlight tile
    selectedTileLayer.setShown(true);
    selectedTileLayer.setEeObject(cellGeom);

    // grid_id
    var id = cellFeat.get('grid_id');
    id.evaluate(function(idClient) {
      tileLabel.setValue('Tile: ' + idClient);
    });

    // build URL (download GEDI output for that tile)
    var url = ee.Image(lastOutputImage).getDownloadURL({
      name: 'OF4D_tile',
      crs: 'EPSG:5070',
      scale: 30,
      region: cellGeom,
      filePerBand: false,
      format: 'GEO_TIFF'
    });

    tileDownloadLabel.setValue('Download selected tile');
    tileDownloadLabel.setUrl(url);
    tileDownloadLabel.style().set('shown', true);

    statusLabel.setValue('Status: ready ✅ click "Download selected tile"');
  });
});

// Small UI line to show chosen grid_id
var tileLabel = ui.Label('Tile: —', {
  backgroundColor: color_selected,
  color: 'yellow',
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  fontSize: '14px',
  padding: '4px',
  margin: '6px 0 0 0'
});
// Link (piccolo) per scaricare la tile cliccata
var tileDownloadLabel = ui.Label('Download tile', {
  color: 'blue',
  textDecoration: 'underline',
  shown: false,
  margin: '4px 0 0 0'
});

///*********************************************************************************************************
//*************************************   Horizontal panels ************************************************
///*********************************************************************************************************
var AAHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var BBHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var CCHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var KKHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var ZZHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: color_selected, 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
///*********************************************************************************************************
//********************************************   Run boxes  ************************************************
///*********************************************************************************************************
var runGEDIMetrics = ui.Button({
      label: 'Run',style: {color: '#333333',border: '3px solid darkgray'}});
     // runGEDIMetrics.onClick(map_gedi);
     runGEDIMetrics.onClick(function () {
  setRunningUI('running… please wait');
  urlLabel.style().set('shown', false);  // hide old link
  try {
    map_gedi();
    // If user DID NOT select download, we don't have a callback.
    // So we stop the spinner after a short time.
    var Inputs = loadInputs();
    if (!Inputs.u_DownloadOutput) {
      setDoneUI('finished ✅ (map added)');
    } else {
      statusLabel.setValue('Status: computing… generating download link when ready…');
    }
  } catch (e) {
    setErrorUI('error: ' + e);
  }
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
//
//var image = ee.Image('projects/ee-calvites1990/assets/_logo_new1');
var image = ee.Image('projects/ee-calvites1990/assets/_logo_new2_curve');
// 
var logo = ui.Thumbnail({
  image: image.visualize({
    min: 0,
    max: 255
  }),
  params: {dimensions: 400},   // dimensione di rendering (qualità)
  style: {
    width: '170px', 
    height: '155px',
    padding: '0px',
    margin: '4px auto 4px auto',
    backgroundColor: 'white'//'#eeeaea'
  }
});
//
var image2 = ee.Image('projects/ee-calvites1990/assets/_logo_new1');
// 
var logo_bellow = ui.Thumbnail({
  image: image2.visualize({
    min: 0,
    max: 255
  }),
  params: {dimensions: 400},   // dimensione di rendering (qualità)
  style: {
    width: '300px', 
    height: '80px',
    padding: '0px',
    margin: '4px auto 4px auto',
    backgroundColor: 'white'//'#eeeaea'
  }
});
///*********************************************************************************************************
//********************************************   Link to github  *******************************************
///*********************************************************************************************************

var documentationLabel = ui.Label({
  value: 'User Guide ℹ️ ',
  targetUrl: 'https://openforest4d.org/gee_gedi_forest_structure_maps/',
  style: {
    fontSize: '18px',
    color: 'blue',
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
    fontFamily: "sans-serif",
    fontWeight: "bold",
    fontSize: "16px",
    color: "white",
    whiteSpace: 'pre-wrap',
    padding: "8px",
    margin: "6px 0 0 0"
  }
);
///*********************************************************************************************************
//********************************************   Progress bar  **********************************************
///*********************************************************************************************************

// =====================================================================
// ====================== NEW INPUTS (Forest mask) ======================
// =====================================================================

// Source selector
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
  style: {backgroundColor: color_selected, shown: true, fontFamily: "sans-serif",
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
  style: {backgroundColor: color_selected, shown: false, fontFamily: "sans-serif",
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


///*********************************************************************************************************
//********************************************   Final boxes  **********************************************
///*********************************************************************************************************
// ********  MAIN INFORMATION *********
panel.add(logo);
panel.add(Title);
panel.add(documentationLabel);
panel.add(Subtitle);
panel.add(spatialExtenttitle);
panel.add(chooseAoiCheckSelector);
panel.add(aoiShpTexbox);
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
secondpanel4.add(CCHorizontalPanel)
secondpanel3.add(secondpanel4) 
// ********  CHOOSE MACHINE LEARNING *********
panel.add(GeneralModelCheckbox);
panel.add(secondpanel3)
// ***************  PANEL ********************
panel.add(downloadsettingtitle);
panel.add(u_DownloadOutputCheckbox);
panel.add(outputFolderLabel);
panel.add(u_outputFolderTexbox);
panel.add(outputImgNameLabel);
panel.add(u_outputImgNameTexbox);
panel.add(urlLabel);
//
panel.add(statusLabel);
panel.add(progressBar);
panel.add(tileLabel);
panel.add(tileDownloadLabel);


// ***************  explore pixel value ********************
//panel.add(showInspectorCheckbox);
// ***************  run ********************
panel.add(runGEDIMetrics);
panel.add(removeLayersButton);
panel.add(acknowledgement);
panel.add(logo_bellow);
{
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));  
ui.root.insert(0, panel);  
}


///*********************************************************************************************************
//********************************************   End  ******************************************************
///*********************************************************************************************************