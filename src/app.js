require("dotenv").config();
const ScansController = require("./controllers/ScansController");
const PdfScansController = require("./controllers/PdfScansController");
const GuidanceController = require("./controllers/GuidanceController");
const StepsController = require("./controllers/StepsController");
const UserController = require("./controllers/UserController");
const ProjectController = require("./controllers/ProjectController");
const Auth = require("./auth/auth");
const express = require("express");
const multer = require("multer");
const path = require("path");
const config = require("./environments/environment.development.json");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
const { connectDatabase } = require("./dao/database");
const port = process.env.PORT || 8080;
const DeviceController = require("./controllers/DeviceController");
const ReportController = require("./controllers/ReportsController");
const DevController = require("./controllers/DevController");

const ViolationController = require("./controllers/ViolationController");

// Handle csv uploads
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/csv"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadCsv = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// Handle pdf uploads
// Ensure the pdf uploads directory exists
const pdfUploadsDir = path.join(__dirname, "uploads", "pdfs");
if (!fs.existsSync(pdfUploadsDir)) {
  fs.mkdirSync(pdfUploadsDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pdfUploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "./uploads/images"))
);
const cors = require("cors");

app.use(cors()); //any origin

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(function (req, res, next) {
  res.header("Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE, PATCH");
  next();
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`0Barriers Backend listening on port: ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error while setting up the database:", error);
  });


// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/images"); // This is the destination directory for image uploads
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// run scheduled scans on every hour
const runScheduledScans = require('./jobs/RunScheduledScans.js');
runScheduledScans();

app.get("/scan/urls", Auth.authenticateToken, ScansController.getURLs);

app.get("/request", Auth.authenticateToken, ScansController.getRequest);

app.post("/create-scan", Auth.authenticateToken, ScansController.createScan);
app.post("/run-scan", Auth.authenticateToken, ScansController.runScan);
app.post(
  "/schedule-scan",
  Auth.authenticateToken,
  ScansController.scheduleScan
);
app.put("/scan/edit", Auth.authenticateToken, ScansController.editScan);
app.delete("/scan/delete", Auth.authenticateToken, ScansController.deleteScan);
app.delete(
  "/scan/delete-multiple-scans",
  Auth.authenticateToken,
  ScansController.deleteMultipleScans
);

// PDF scan endpoints
app.post(
  "/pdf-scan/create",
  Auth.authenticateToken,
  uploadPdf.single("pdf"),
  PdfScansController.createPdfScan
);
app.delete(
  "/pdf-scan/delete/:pdfScanId",
  Auth.authenticateToken,
  PdfScansController.deletePdfScan
);
app.get(
  "/pdf-scans",
  Auth.authenticateToken,
  PdfScansController.getAllPdfScans
);
app.get(
  "/pdf-scan/:pdfScanId",
  Auth.authenticateToken,
  PdfScansController.getPdfScanById
);
app.post(
  "/pdf-scan/run/:pdfScanId",
  Auth.authenticateToken,
  PdfScansController.runPdfScan
);
app.get(
  "/pdf-scan/results/:pdfScanId",
  Auth.authenticateToken,
  PdfScansController.getScanResults
);

app.get("/get-steps", Auth.authenticateToken, StepsController.getSteps);
app.get("/scan", Auth.authenticateToken, ScansController.getResults);
app.get(
  "/score",
  Auth.authenticateToken,
  ScansController.getAccessibilityScore
);
app.get(
  "/guidance-levels",
  Auth.authenticateToken,
  GuidanceController.getGuidanceLevels
);
app.get(
  "/device-configs",
  Auth.authenticateToken,
  DeviceController.getDeviceConfigs
);
app.get("/scan/urls", Auth.authenticateToken, ScansController.getURLs);
app.get(
  "/scan_request",
  Auth.authenticateToken,
  ScansController.getScanRequest
);

app.get(
  "/scan/:scanRequestId/report/",
  Auth.authenticateToken,
  ReportController.generateReport
);

app.post("/login", Auth.login);
app.post("/token", Auth.refresh);
app.delete("/logout", Auth.logout);

app.get("/users", Auth.authenticateToken, UserController.getAll);
app.post("/register", UserController.register);
app.post("/registerClient", UserController.registerClient);
app.get("/user", Auth.authenticateToken, UserController.getUsername);
app.patch(
  "/user",
  upload.single("avatar"),
  Auth.authenticateToken,
  UserController.edit
);
app.delete("/user", Auth.authenticateToken, UserController.deleteUser);
app.put("/user/approve", Auth.authenticateToken, UserController.approve);

app.get("/projects", Auth.authenticateToken, ProjectController.getAll);  //retrieve projects to display in that table
app.get("/project", Auth.authenticateToken, ProjectController.getProjectById);
app.post("/project", Auth.authenticateToken, ProjectController.create);
app.patch("/project", Auth.authenticateToken, ProjectController.edit); //editing projects
app.delete("/project", Auth.authenticateToken, ProjectController.deleteProject);

// TODO: delete
app.get("/getToken", DevController.getJwtToken);

app.post(
  "/violations/upload",
  Auth.authenticateToken,
  uploadCsv.single("file"),
  ViolationController.uploadViolationDescriptions
);

app.get(
  "/violations/descriptions",
  Auth.authenticateToken,
  ViolationController.getCustomDescriptions
);

// Use this scan endpoint for scan results if custom violation descriptions are needed
app.get(
  "/scan/custom",
  Auth.authenticateToken,
  ScansController.getResults,
  ViolationController.applyCustomViolationDescriptions,
  (req, res) => {
    res.json(res.locals.scanResults);
  }
);
