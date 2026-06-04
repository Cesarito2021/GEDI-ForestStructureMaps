 //***********************************************************************************************
 //***************************************** GEDI data *******************************************
 //***********************************************************************************************
var ToGEDI = function (data, gedi_type, startDateGEDI, endDateGEDI, quantile, mask_raster,
                      minSensitivity, beams_type, shoot_time_type) {

  var hasMask = mask_raster !== null && mask_raster !== undefined;
  minSensitivity = (minSensitivity === undefined) ? null : minSensitivity;
  beams_type = (beams_type === undefined || beams_type === null) ? 'all' : beams_type;
  shoot_time_type = (shoot_time_type === undefined || shoot_time_type === null) ? 'all' : shoot_time_type;

  // apply mask only if band exists
  function maskIfBandExists(img, bandName, maskImage) {
    var hasBand = img.bandNames().contains(bandName);
    return ee.Image(ee.Algorithms.If(hasBand, img.updateMask(maskImage), img));
  }

  function applyOptionalFilters(img) {

    // sensitivity >= minSensitivity
    if (minSensitivity !== null) {
      img = maskIfBandExists(img, 'sensitivity', img.select('sensitivity').gte(minSensitivity));
    }

    // beam filter
    if (beams_type !== 'all') {
      img = maskIfBandExists(img, 'beam', (function() {
        var b = img.select('beam');

        if (beams_type === 'full_power') {
          return b.eq(5).or(b.eq(6)).or(b.eq(8)).or(b.eq(11));
        }

        if (beams_type === 'coverage') {
          return b.eq(0).or(b.eq(1)).or(b.eq(2)).or(b.eq(3));
        }

        // if unknown string -> don't change anything
        return ee.Image(1);
      })());
    }

    // day/night filter
    if (shoot_time_type !== 'all') {
      img = maskIfBandExists(img, 'solar_elevation', (function() {
        var se = img.select('solar_elevation');
        if (shoot_time_type === 'nighttime') return se.lte(0);
        if (shoot_time_type === 'daytime')   return se.gt(0);
        return ee.Image(1);
      })());
    }

    // external mask (FNF etc.)
    if (hasMask) {
      img = img.updateMask(mask_raster.eq(1).or(mask_raster.eq(2)));
    }

    return img;
  }

  // --- product-specific base masks ---
  var maskL2A = function (img) {
    var im = img.updateMask(img.select('quality_flag').eq(1))
                .updateMask(img.select('degrade_flag').eq(0));
    return applyOptionalFilters(im);
  };

  var maskL2B = function (img) {
    var im = img.updateMask(img.select('l2b_quality_flag').eq(1))
                .updateMask(img.select('degrade_flag').eq(0));
    return applyOptionalFilters(im);
  };

  var maskL4A = function (img) {
    var im = img.updateMask(img.select('l4_quality_flag').eq(1))
                .updateMask(img.select('degrade_flag').eq(0));
    return applyOptionalFilters(im);
  };

  // ---------------- L2A ----------------
  if (gedi_type === 'singleGEDI') {
    var icSingle = ee.ImageCollection(data || 'LARSE/GEDI/GEDI02_A_002_MONTHLY')
      .map(maskL2A)
      .filterDate(startDateGEDI, endDateGEDI);

    var bandForSingle = (typeof quantile === 'string') ? quantile : 'rh95';

    // ✅ STABLE: use median over the time window
    return icSingle.select([bandForSingle]).median().rename('rh');
  }

  if (gedi_type === 'meanGEDI') {
    var icMean = ee.ImageCollection(data || 'LARSE/GEDI/GEDI02_A_002_MONTHLY')
      .map(maskL2A)
      .filterDate(startDateGEDI, endDateGEDI);

    // keep your rh98 choice, but use median (stable)
    var img = icMean.select(['rh98']).median();
    return img.reduce(ee.Reducer.mean()).rename('rh');
  }

  // ---------------- L2B ----------------
  if (gedi_type === 'pai' || gedi_type === 'fhd_normal' || gedi_type === 'cover') {
    var icL2B = ee.ImageCollection('LARSE/GEDI/GEDI02_B_002_MONTHLY')
      .map(maskL2B)
      .filterDate(startDateGEDI, endDateGEDI);

    return icL2B.select([gedi_type]).median().rename('rh');
  }

  // ---------------- L4A ----------------
  if (gedi_type === 'agbd') {
    var icL4A = ee.ImageCollection('LARSE/GEDI/GEDI04_A_002_MONTHLY')
      .map(maskL4A)
      .filterDate(startDateGEDI, endDateGEDI);

    return icL4A.select(['agbd']).median().rename('rh');
  }

  throw new Error('Unknown gedi_type: ' + gedi_type);
};

exports.ToGEDI = ToGEDI;
