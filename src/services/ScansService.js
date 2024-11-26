const { AxePuppeteer } = require("@axe-core/puppeteer");
const puppeteer = require("puppeteer");
const DeviceConfigRepo = require("../repository/DeviceConfigRepo");

const ScansRepo = require("../repository/ScansRepo");
const UserRepo = require("../repository/UserRepo");

const helper = require("./ScanServiceHelpers");
const { countSlashes } = require("./ScanServiceHelpers");

const { runSteps } = require("./ScansSteps.js");
const { getAllUsersByProjectId } = require("./ProjectService");

async function createScan(
  url,
  guidance,
  depth,
  device_config,
  steps,
  name,
  projectID,
  username
) {
  const scannedURLs = new Set(); // To track scanned URLs and avoid duplicates
  const baseUrl = helper.extractBaseUrl(url);

  async function scanAndLogURLS(url, currentDepth) {
    if (currentDepth > depth) {
      return; // Stop scanning if we've reached the desired depth
    }

    if (
      !scannedURLs.has(url) &&
      helper.isSameDomain(baseUrl, url) &&
      !url.endsWith("/#") &&
      countSlashes(url) - 2 === currentDepth
    ) {
      scannedURLs.add(url);
      console.log(`Added URL ${url} at depth ${currentDepth}`);

      // Extract child URLs
      const websiteContent = await helper.getWebsiteContent(url);
      const childURLs = helper.extractChildURLs(websiteContent, baseUrl);

      for (const childURL of childURLs) {
        await scanAndLogURLS(childURL, currentDepth + 1);
      }
    }
  }
  // I made this await because the urls dont all get added to the db, i think there is a way around this though
  await scanAndLogURLS(baseUrl, 0);
  // let selectedDeviceConfig = await DeviceConfigRepo.getDeviceConfigByName(device_config);
  console.log("SERVICE:", username);
  const returnRequest = await ScansRepo.createScanRequest(
    { url, guidance },
    device_config,
    name,
    depth,
    scannedURLs,
    steps,
    projectID,
    username
  );
  return returnRequest;
}

async function runScan(scanRequestId, url_list, device_name) {
  console.log(scanRequestId);
  // get scan by id
  const scan = await ScansRepo.getRequest(scanRequestId);

  // checks if a list of URLs (url_list) and a device name (device_name) are provided as arguments
  if (!url_list) {
    url_list = scan.urls;
  }
  if (!device_name) {
    device_name = await DeviceConfigRepo.getDeviceConfigByName(scan.device);
  } else {
    device_name = await DeviceConfigRepo.getDeviceConfigByName(device_name);
  }

  // launches a browser instance using Puppeteer
  const guidance = scan.guidance;
  console.log(scan.guidance);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  //  For each URL in the list, open a new browser tab (page) and emulates the specified device configuration
  const page = await browser.newPage();
  const all_results = {
    violations: 0,
    passes: 0,
  };

  try {
    // Run the authentication parameter steps before scanning the page using axe
    console.log(`steps: `, scan.steps); //TODO: Remove this line
    if (scan.steps.length != 0) {
      await page.emulate(device_name);
      await page.goto(scan.url, { waitUntil: "domcontentloaded" });
      try {
        console.log(`url: `, scan.url);
        await runSteps(page, scan.steps);
      } catch (error) {
        console.log(error);
        return `Scan Steps issue with Scan request with ID ${scanRequestId}.`;
      }
    }
    for (const url of url_list) {
      console.log(`\nScanning URL ${url}`);
      await page.emulate(device_name);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      console.log("device configuration completed");
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
          page.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 30000,
          }),
          page.goto(url),
          console.log("navigation success"),
        ]);
      } catch (e) {
        console.log("Navigation failed: " + e.message);
      }

      console.log("page navigation completed");

      await page.addScriptTag({ path: require.resolve("axe-core") });
      const results = await new AxePuppeteer(page).withTags(guidance).analyze();
      console.log("axe-core scan completed");

      all_results.passes += results.passes.length;
      all_results.violations += results.violations.length;

      const score = await calculateAccessibilityScore(results);
      console.log("accessibility score calculation completed");

      // Store or process the results here
      await ScansRepo.saveScanResults(scanRequestId, results, score);
      console.log("save results completed");
    }
    // Complete the scan request once all URLs are scanned
    const score = await calculateTotalScore(all_results);
    console.log("total score calculation completed");
    try {
      await ScansRepo.completeScanRequest(scanRequestId, score);
      return `Scan request with ID ${scanRequestId} completed successfully.`;
    } catch (error) {
      console.error("Error completing scan request:", error);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

async function getResults(scanRequestId) {
  return await ScansRepo.getScanResults(scanRequestId);
}

async function getScanRequest(projectId) {
  const scanRequests = await ScansRepo.getScanRequest();

  if (!projectId) {
    return scanRequests;
  }

  // Filter scan requests by project ID
  const projectUserIds = await getAllUsersByProjectId(projectId);
  const userIdToUsername = {};
  const allUsers = await UserRepo.getAll();
  allUsers.forEach((element) => {
    userIdToUsername[element._id] = element.username;
  });
  const projectUsernames = projectUserIds.map(
    (userId) => userIdToUsername[userId]
  );

  const filteredScanRequests = scanRequests.filter((scanRequest) =>
    projectUsernames.includes(scanRequest.username)
  );
  return filteredScanRequests;
}

async function calculateAccessibilityScore(scanResults) {
  if (!scanResults) {
    throw new Error(
      "Scan results are required to calculate the accessibility score."
    );
  }

  const totalChecks = scanResults.violations.length + scanResults.passes.length;
  const passedChecks = scanResults.passes.length;

  if (totalChecks === 0) {
    return 100;
  }

  const accessibilityScore = (passedChecks / totalChecks) * 100;
  return parseFloat(accessibilityScore.toFixed(2));
}

async function calculateTotalScore(scanResults) {
  if (!scanResults) {
    throw new Error(
      "Scan results are required to calculate the accessibility score."
    );
  }

  const totalChecks = scanResults.violations + scanResults.passes;
  const passedChecks = scanResults.passes;

  if (totalChecks === 0) {
    return 100;
  }

  const accessibilityScore = (passedChecks / totalChecks) * 100;
  return parseFloat(accessibilityScore.toFixed(2));
}

async function getUrls(scanRequestId) {
  const results = await ScansRepo.getURLs(scanRequestId);

  const flattenedUrls = results.map((doc) => doc.scanned_urls).flat();

  return flattenedUrls;
}

/**
 * Schedules scan into database
 * @param {*} scanRequestID
 * @param {*} scheduledTime
 * @returns
 */
async function scheduleScan(scheduledTime, scanRequestID) {
  try {
    await ScansRepo.scheduleScan(scanRequestID, scheduledTime);
    return `Scan request with ID ${scanRequestID} scheduled successfully.`;
  } catch (error) {
    console.error("Error in scheduling scan to database", error);
  }
}

/**
 * Runs all expired scans in the database.
 *
 * This function first updates the database to reflect that the scans have been run, and then runs the scans themselves. Scans have their info updated regardless if running is successful or not.
 *
 * @throws Will log error to console if there is an issue accessing the database or running the scans.
 */
async function runExpiredScans() {
  const scansToRun = await ScansRepo.getExpiredScans();

  console.log("Scans to run: ", scansToRun);
  // first update scan info in database. This ensures that the info is correct by the next hour, regardless how long it takes to run the scans.
  for (const scan of scansToRun) {
    try {
      await ScansRepo.updateExpiredScan(scan);
    } catch (error) {
      console.error(
        "Error updating info of scheduled scan: " +
          scan._id +
          "\nwith error: " +
          error
      );
    }
  }

  for (const scan of scansToRun) {
    try {
      await runScan(scan.scanRequestId, scan.urls, scan.device);
    } catch (error) {
      console.error(
        "Error running scheduled scan: " + scan._id + "\nwith error: " + error
      );
    }
  }
}

module.exports = {
  createScan,
  getResults,
  calculateAccessibilityScore,
  getUrls,
  getScanRequest,
  runScan,
  scheduleScan,
  runExpiredScans,
};
