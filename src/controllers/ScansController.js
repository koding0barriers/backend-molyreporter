const ScansService = require("../services/ScansService");
const ScansSteps = require("../services/ScansSteps");
const { getScanResults } = require("../repository/ScansRepo");
const ScanRepo = require("../repository/ScansRepo");
const { getAll } = require("../repository/ProjectRepo");

// dina added new
async function createScan(request, response) {
  try {
    // console.log("Request Object:", request); // Log the entire request object
    const { scan_url, guidance, depth, device_config, steps, name } =
      request.body;

    if (!scan_url || !guidance) {
      response.status(400).send("Please provide a scan_url and a guidance.");
      return;
    }
    const username = request.user.username;
    //const projectID = request.body.project._id //Original not working changed to projectID as below line
    const projectID = request.body.projectID;

    const request_id = await ScansService.createScan(
      scan_url,
      guidance,
      depth >= 0 ? depth : 0,
      device_config,
      steps,
      name,
      projectID,
      username
    );

    response.json({ request_id });
  } catch (err) {
    console.error(err);
    response.status(500).send("Internal server error");
  }
}

async function runScan(request, response) {
  try {
    if (!request.body.scanRequestIdList) {
      response.status(400).send("Please provide scanRequestIdList.");
      return;
    }
    const scanRequestIdList = request.body.scanRequestIdList;

    const allResults = [];
    for (const scanRequestId of scanRequestIdList) {
      const currScanRes = ScansService.runScan(
        scanRequestId,
        request.body.urls,
        request.body.device
      );
      allResults.push(currScanRes);
    }
    const res = await Promise.all(allResults);

    response.json({ res });
  } catch (err) {
    console.error(err);
    response.status(500);
  }
}

async function getResults(request, response) {
  try {
    if (!request.query.scanRequestId) {
      response.status(400).send("Please provide a scanRequestId.");
    }

    const results = await ScansService.getResults(request.query.scanRequestId);

    response.json(results);
  } catch (err) {
    console.error(err);
  }
}

async function getRequest(request, response) {
  try {
    if (!request.query.scanRequestId) {
      response.status(400).send("Please provide a scanRequestId.");
    }
    const results = await ScanRepo.getRequest(request.query.scanRequestId);

    response.json(results);
  } catch (err) {
    console.error(err);
  }
}

async function getAccessibilityScore(request, response) {
  try {
    const scanRequestID = request.query.scanRequestId;

    const scanResults = await getScanResults(scanRequestID);

    if (!scanResults) {
      return response.status(404).json({ message: "Scan result not found." });
    }

    const accessibilityScore =
      await ScansService.calculateAccessibilityScore(scanResults);

    return response.json({ accessibilityScore });
  } catch (err) {
    console.error(err);
    response.status(500).json({
      error: "An error occurred while calculating the accessibility score.",
    });
  }
}

// dina added new
async function editScan(request, response) {
  try {
    const {
      scanRequestId,
      name,
      device_config,
      depth,
      guidance,
      steps,
      projectID,
      username,
    } = request.body;
    const output = await ScanRepo.editScan(
      scanRequestId,
      name,
      device_config,
      depth,
      guidance,
      steps,
      projectID,
      username
    );
    response.json(output);

    if (output === 0) {
      console.log("No changes made to this scan.");
    } else {
      console.log(`${output} record(s) updated.`);
    }
  } catch (err) {
    console.error(err);
    response.status(500).send("Internal server error");
  }
}

/**
 * Handles an HTTP request to delete a scan request from the database.
 *
 * This function interacts with the ScanRepo module to delete a scan request based on the
 * scanRequestId provided in the request body. It sends a JSON response with the number of
 * records deleted or an error message if the operation fails.
 *
 * @async
 * @function deleteScan
 *
 * @param {Object} request - The HTTP request object.
 * @param {Object} request.body - The body of the request containing the scanRequestId.
 * @param {string} request.body.scanRequestId - The unique ID of the scan request to be deleted.
 *
 * @param {Object} response - The HTTP response object used to send back the result.
 *
 * @returns {void} Sends a JSON response with details about the deletion or an error message.
 *
 * @throws Will send a 400 status code if the scanRequestId is invalid or missing.
 *         Will send a 404 status code if no record is found with the given scanRequestId.
 *         Will send a 500 status code if the database operation fails.
 *
 * @example
 * Request body:
 * // { "scanRequestId": "60c72b2f9b1d4b0017c4c1e8" }
 *
 * // Response on success:
 * // { "deletedCount": 1 }
 *
 * // Response if not found:
 * // { "message": "No record found with the given scanRequestId." }
 */
async function deleteScan(request, response) {
  try {
    const { scanRequestId } = request.body;
    // console.log("Request Object:", request); // Log the entire request object

    // Validate scanRequestId
    if (!scanRequestId) {
      return response.status(400).json({ error: "Invalid scanRequestId" });
    }

    // Call ScanRepo to delete the scan request
    const output = await ScanRepo.deleteScan(scanRequestId);

    // Handle when no record was deleted (output === 0)
    if (output === 0) {
      return response
        .status(404)
        .json({ message: "No record found with the given scanRequestId." });
    }

    response.status(200).json({ deletedCount: output });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Handles an HTTP request to delete multiple scan requests from the database.
 *
 * This function interacts with the ScanRepo module to delete multiple scan requests based on the
 * scanRequestIds provided in the request body. It sends a JSON response with the number of
 * records deleted or an error message if the operation fails.
 *
 * @async
 * @function deleteMultipleScans
 *
 * @param {Object} request - The HTTP request object.
 * @param {Object} request.body - The body of the request containing the scanRequestIds array.
 * @param {string[]} request.body.scanRequestIds - An array of unique IDs of the scan requests to be deleted.
 *
 * @param {Object} response - The HTTP response object used to send back the result.
 *
 * @returns {void} Sends a JSON response with details about the deletion or an error message.
 *
 * @throws Will send a 400 status code if the scanRequestIds array is invalid or missing.
 *         Will send a 500 status code if the database operation fails.
 *
 * @example
 * Request body:
 * // { "scanRequestIds": ["60c72b2f9b1d4b0017c4c1e8", "60c72b2f9b1d4b0017c4c1e9"] }
 *
 * // Response on success:
 * // { "deletedCount": 2 }
 *
 * // Response if no records found:
 * // { "message": "No records found for the given scanRequestIds." }
 */
async function deleteMultipleScans(request, response) {
  try {
    const { scanRequestIds } = request.body;

    // Validate scanRequestIds array
    if (!Array.isArray(scanRequestIds) || scanRequestIds.length === 0) {
      return response.status(400).json({ error: 'Invalid or missing scanRequestIds' });
    }

    // Call ScanRepo to delete the scan requests
    const deletedCount = await ScanRepo.deleteMultipleScans(scanRequestIds);

    // Handle when no records were deleted
    if (deletedCount === 0) {
      return response.status(404).json({ message: 'No records found for the given scanRequestIds.' });
    }

    response.status(200).json({ deletedCount });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getURLs(request, response) {
  if (!request.query.scanRequestId) {
    response.status(400).send("Please provide a scanRequestId.");
  }

  try {
    const urls = await ScansService.getUrls(request.query.scanRequestId);
    response.json(urls);
  } catch (err) {
    console.error(err);
    response.status(500);
  }
}

async function getScanRequest(request, response) {
  try {
    const results = await ScansService.getScanRequest(request?.query?.projectID);
    response.json(results);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Schedules scan at a later time. Delegates work to ScansServices.scheduleScan
 *
 * This function takes in a scanRequestIdList and a scheduledTime and schedules the scan to run at the specified time. It sends a confirmation back to the caller for each scan that was successfully scheduled. 
 *
 * @function scheduleScan
 *
 * @param {Object} request - The HTTP request object.
 * @param {Object} request.body - The body of the request containing the scanRequestIdList and scheduledTime.
 * @param {string[]} request.body.scanRequestIdList - The unique IDs of the scan requests to be scheduled.
 * @param {number} request.body.scheduledTime - The time at which the scan should be scheduled.
 *
 * @param {Object} response - The HTTP response object used to send back the result.
 *
 * @returns {void} Sends a JSON response with a confirmation message.
 *
 * @throws Will send a 400 status code if the scanRequestIdList or scheduledTime is invalid or missing.
 *         Will send a 500 status code if the scheduling operation fails.
 *
 * @example
 * Request body:
 * // {
 * //   "scanRequestIdList": ["60c72b2f9b1d4b0017c4c1e8", "60c72b2f9b1d4b0017c4c1e9"],
 * //   "scheduledTime": 1643723400
 * // }
 *
 * // Response on success:
 * // "ok"
 *
 * // Response if not found:
 * // { "message": "No records found with the given scanRequestIdList." }
 */
async function scheduleScan(request, response) {
  try {
    if (!request.body.scanRequestIdList) {
      response.status(400).send("Please provide scanRequestIdList.");
      return;
    }

    const scheduledTime = request.body.scheduledTime;
    const scanRequestIdList = request.body.scanRequestIdList;   
    const allResults = [];

    for (const scanRequestId of scanRequestIdList) {
      try {
        const currScanRes = ScansService.scheduleScan(
          scheduledTime,
          scanRequestId
        );
        allResults.push(currScanRes);
      } catch (error) {
        console.error("Error occurred while scheduling scan:", error);
        response.status(500).send("Error occurred while scheduling scan");
      }
    }
    // wait for all responses if scan scheduled
    const res = await Promise.all(allResults);
    response.json({res});
  } catch (err) {
    console.error("Error occurred while scheduling scan:", err);
    response.status(500).send("Error occurred while scheduling scan");
  }
}



/**
 * Runs all expired scans.
 *
 * This function will check for expired scans in the database and run them.
 * It will use the ScansService to run the scans.
 *
 * @async
 * @function runExpiredScans
 *
 * @returns {void} Nothing is returned.
 *
 * @throws Will display error to console if any error scheduling scans.
 *
 * @example
 * await runExpiredScans();
 */
async function runExpiredScans() {
  await ScansService.runExpiredScans();
}

module.exports = {
  createScan,
  getResults,
  getAccessibilityScore,
  getURLs,
  getScanRequest,
  editScan,
  deleteScan,
  runScan,
  getRequest,
  scheduleScan,
  deleteMultipleScans,
  runExpiredScans
};
