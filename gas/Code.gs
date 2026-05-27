/**
 * Travel OS — Google Apps Script
 * ================================
 * This script lets the Travel OS web app write settings back to your
 * Google Sheet, triggering a full recalculation of FILTER_RESULTS.
 *
 * HOW TO DEPLOY:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click "Deploy" → "New deployment"
 * 5. Type: Web App
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Click "Deploy" and copy the URL
 * 9. Paste that URL in the Travel OS Settings panel → "Apps Script URL"
 *
 * HOW IT WORKS:
 * - Travel OS sends a GET request with settings as URL parameters
 * - This script writes each parameter to the matching row in SETTINGS sheet
 * - Google Sheets recalculates TRIP_ENGINE and FILTER_RESULTS automatically
 * - Travel OS re-fetches FILTER_RESULTS after ~5 seconds
 */

var SETTINGS_SHEET_NAME = 'SETTINGS';

function doGet(e) {
  try {
    var ss     = SpreadsheetApp.getActiveSpreadsheet();
    var sheet  = ss.getSheetByName(SETTINGS_SHEET_NAME);

    if (!sheet) {
      return jsonResponse({ error: 'Sheet "' + SETTINGS_SHEET_NAME + '" not found' }, 404);
    }

    var params = e.parameter || {};

    // If no parameters sent, just return current settings (health check)
    if (Object.keys(params).length === 0 || params.cachebust) {
      return jsonResponse({ status: 'alive', timestamp: new Date().toISOString() });
    }

    // Read all rows: [[key, value], [key, value], ...]
    var data    = sheet.getDataRange().getValues();
    var updated = [];

    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0]).trim();
      if (key && params[key] !== undefined) {
        var raw = params[key];
        // Convert to number if it looks numeric (but not "Yes"/"No" etc.)
        data[i][1] = (!isNaN(raw) && raw !== '') ? Number(raw) : raw;
        updated.push(key);
      }
    }

    if (updated.length > 0) {
      sheet.getDataRange().setValues(data);
      SpreadsheetApp.flush(); // Force recalculation before returning
    }

    return jsonResponse({
      status:    'ok',
      updated:   updated,
      count:     updated.length,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * TEST — run this manually in the Apps Script editor to verify it works.
 * Check the Execution log for output.
 */
function testWrite() {
  var mockEvent = {
    parameter: {
      Budget:              '7500',
      Culture:             '9',
      Food:                '8',
      'Prefer_Combos_(Yes/No)': 'Yes',
    }
  };

  var result = doGet(mockEvent);
  Logger.log(result.getContent());
}
