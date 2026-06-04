//***********************************************************************************************
//****************************************** HLS   **********************************************
//***********************************************************************************************

var calculateCompositeClipHLS = function(year, startDate, endDate, cloudsTh, MaxCloudsProbability, mask_raster, geometry, hlsType) {
  hlsType = hlsType || 'L30'; // default

  var startDateWithYear = year + "-" + startDate;  // e.g., "2019-06-01"
  var endDateWithYear   = year + "-" + endDate;

  // ---- pick collection(s) ----
  var L30 = ee.ImageCollection('NASA/HLS/HLSL30/v002');
  var S30 = ee.ImageCollection('NASA/HLS/HLSS30/v002');

  var col = (hlsType === 'S30') ? S30
          : (hlsType === 'BOTH') ? L30.merge(S30)
          : L30; // default L30

  // ---- basic filters ----
  col = col
    .filterDate(startDateWithYear, endDateWithYear)
    .filterBounds(geometry)
    .filter(ee.Filter.lt('CLOUD_COVERAGE', cloudsTh));

  // ---- Fmask QA mask ----
  // Bits (v2): 1=Cloud, 2=Cloud shadow, 3=Snow/Ice, 4=High aerosol  (1 << bit)
  var maskHLS = function(img) {
    var qa = img.select('Fmask');
    var cloud   = qa.bitwiseAnd(1 << 1).neq(0);
    var shadow  = qa.bitwiseAnd(1 << 2).neq(0);
    var snow    = qa.bitwiseAnd(1 << 3).neq(0);
    var aerosol = qa.bitwiseAnd(1 << 4).neq(0);
    var good = cloud.or(shadow).or(snow).or(aerosol).not();
    return img.updateMask(good);
  };

  // ---- edge mask + optional external raster mask ----
  var maskEdges = function(img) {
    // Use a NIR band’s native mask for validity:
    // L30: B5 (NIR). S30: B8A (NIR-narrow). If BOTH, try both with fallback.
    var nirMask =
      ee.Algorithms.If(
        img.bandNames().contains('B5'),
        img.select('B5').mask(),
        ee.Algorithms.If(
          img.bandNames().contains('B8A'),
          img.select('B8A').mask(),
          img.mask() // fallback: existing mask
        )
      );
    var out = img.updateMask(ee.Image(nirMask));
    if (mask_raster) out = out.updateMask(mask_raster.eq(1));
    return out;
  };

  // apply masks, median composite, clip
  var composite = col.map(maskHLS).map(maskEdges).median().clip(geometry);

  return composite;
};
exports.calculateCompositeClipHLS = calculateCompositeClipHLS;

