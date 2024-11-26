const fs = require("fs");
const path = require("path");

function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "short",
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

function generate(cleaned_data) {
  return new Promise((resolve, reject) => {
    try {
      // scanResults - a list of scanResult extends from the base url
      const scanResults = cleaned_data.scanResults;
      // violations - a list of violations of all urls
      const violations = cleaned_data.violations;

      // Summary section
      let csvContent =
        "Scan Request ID,Score,Test Engine Name,Test Engine Version,Test Runner Name,User Agent,Window Width,Window Height,Orientation Angle,Orientation Type,Timestamp,URL,Inapplicable Count,Passes Count,Incomplete Count,Violations Count\n";

      scanResults.forEach((result) => {
        const {
          scanRequestId,
          score,
          testEngine: { name: engineName, version: engineVersion },
          testRunner: { name: runnerName },
          testEnvironment: {
            userAgent,
            windowWidth,
            windowHeight,
            orientationAngle,
            orientationType,
          },
          timestamp,
          url,
          inapplicable,
          passes,
          incomplete,
          violations,
        } = result;
        let complete_url = cleaned_data.baseUrl + url;
        const summaryRow = `"${scanRequestId}","${score}","${engineName}", "${engineVersion}","${runnerName}","${userAgent}","${windowWidth}", "${windowHeight}","${orientationAngle}","${orientationType}", "${formatDate(timestamp)}","${complete_url}","${inapplicable.length}", "${passes.length}","${incomplete.length}","${violations.length}"\n`;
        csvContent += summaryRow;
      });

      // Pagewise Analysis
      csvContent += "\n\nURL Violations and Scores\n";

      // Determine unique violation IDs for column headers
      const violationIds = [...new Set(violations.map((v) => v.id))];
      csvContent += "URL," + violationIds.join(",") + ",Scores\n";

      // Map for counting the number of URLs each violation occurs in
      const violationCounts = new Map(violationIds.map((id) => [id, 0]));

      scanResults.forEach((result) => {
        let row = result.url + ",";
        let score = result.score;
        let violationsPresent = new Set(result.violations.map((v) => v.id));

        // Fill in the row with 'X' if the violation is present for the URL
        violationIds.forEach((id) => {
          if (violationsPresent.has(id)) {
            row += "X,";
            violationCounts.set(id, violationCounts.get(id) + 1);
          } else {
            row += ",";
          }
        });

        // Append the score at the end of the row
        row += score;
        csvContent += row + "\n";
      });
      csvContent +=
        "Scores," + Array.from(violationCounts.values()).join(",") + "\n";

      // Violations Section
      csvContent +=
        "\nID,Tags,Description,Help,Disabilities,Help URL,How to Fix,Why It Matters\n";

      violations.forEach((violation) => {
        const {
          id,
          tags,
          description,
          help,
          disabilities,
          helpUrl,
          howToFix,
          whyItMatters,
        } = violation;
        const disabilitiesStr = disabilities.join("; ");
        const tagsStr = tags.join("; ");

        const violationRow = `"${id}","${tagsStr}","${description.replace(/"/g, '""')}","${help.replace(/"/g, '""')}","${disabilitiesStr}","${helpUrl}","${howToFix.replace(/"/g, '""')}","${whyItMatters.replace(/"/g, '""')}"\n`;
        csvContent += violationRow;
      });

      // Detailed Information Section
      csvContent += "\n\nOther Detailed Information\n";
      csvContent += "URL,Category,ID,Tags,Description,Help\n";

      scanResults.forEach((result) => {
        const addDetails = (categoryName, items, url) => {
          items.forEach((item) => {
            const { id, tags, description, help } = item;
            const tagsStr = tags.join("; "); // Join tags with semicolon for CSV
            const detailRow = `"${url}","${categoryName}","${id}","${tagsStr}","${description.replace(/"/g, '""')}","${help.replace(/"/g, '""')}"\n`;
            csvContent += detailRow;
          });
        };

        // Append details for each category
        let complete_url = cleaned_data.baseUrl + result.url;
        addDetails("Passes", result.passes, complete_url);
        addDetails("Inapplicable", result.inapplicable, complete_url);
        addDetails("Incomplete", result.incomplete, complete_url);
        addDetails("Violations", result.violations, complete_url);
      });

      const outputDir = path.join(__dirname, "output");

      // Check if the output directory exists, create it if not
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, "scanResults.csv");

      // Write the CSV content to a file in the output directory
      fs.writeFile(filePath, csvContent, (err) => {
        if (err) {
          reject("Error writing CSV file: " + err.message);
        } else {
          console.log(`CSV report generated at ${filePath}`);
          resolve(filePath); // Resolve with the path of the generated CSV file in the output directory
        }
      });
    } catch (error) {
      console.error("Error generating CSV report:", error);
      reject("Error generating CSV report: " + error.message);
    }
  });
}

module.exports = {
  generate,
};
