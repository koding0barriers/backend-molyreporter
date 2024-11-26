const ReportsService = require("../services/ReportService");

const fs = require("fs");
const path = require("path");

async function generateReport(request, response) {
  try {
    const scanRequestId = request.params.scanRequestId;
    const username = request.user.username;
    const format = request.query.format || "csv"; // default to CSV if no format is provided
  
    if (!scanRequestId) {
      response.status(400).send("Please provide a scanRequestId.");
      return;
    }

    const reportFile = await ReportsService.generateReport(
      scanRequestId,
      format,
      username
    );

    if (format === "csv") {
      response.setHeader("Content-Type", "text/csv");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=report-${scanRequestId}.csv`
      );
      // If reportFile is a stream, pipe it directly to response
      if (reportFile instanceof require("stream").Readable) {
        reportFile.pipe(response);
      }
      console.log(reportFile)
      fs.createReadStream(reportFile).pipe(response);
    }  else if (format === 'pdf') {
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `attachment; filename=report-${scanRequestId}.pdf`);
      if (reportFile && typeof reportFile.pipe === 'function') {
        reportFile.pipe(response);}
         else {
        fs.createReadStream(reportFile).pipe(response);
      }
    } else if (format === "html") {
      response.setHeader("Content-Type", "text/html");
      if (typeof reportFile === "function") {
        response.send(reportFile);
      } else {
        response.setHeader(
          "Content-Disposition",
          `attachment; filename=report-${scanRequestId}.html`
        );
        fs.createReadStream(reportFile).pipe(response);
      }
    } else {
      response.status(400).send("Unsupported report format.");
    }
  } catch (err) {
    console.error(err);
    response.status(500).send("Error generating report.");
  }
}

module.exports = {
  generateReport,
};
