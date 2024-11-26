const fs = require("fs").promises;
const PdfScansService = require("../services/PdfScansService");

class PdfScansController {
  static async createPdfScan(req, res) {
    try {
      const { username } = req.user;

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const fileData = {
        path: req.file.path,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };

      const result = await PdfScansService.createPdfScan(fileData, username);

      res.status(201).json({
        message: "PDF scan created successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error creating PDF scan:", error);
      res.status(500).json({ error: "Failed to create PDF scan" });
    } finally {
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch((error) => {
          console.error("Failed to delete uploaded PDF file:", error);
        });
      }
    }
  }

  static async deletePdfScan(req, res) {
    try {
      const { pdfScanId } = req.params;
      console.log(`[PdfScansController.deletePdfScan] pdfScanId: ${pdfScanId}`);

      if (!pdfScanId || pdfScanId === ":pdfScanId") {
        return res.status(400).json({ error: "pdfScanId is required" });
      }

      await PdfScansService.deletePdfScan(pdfScanId);
      res.json({ message: "PDF scan deleted successfully" });
    } catch (error) {
      if (error.message === "PDF scan not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error deleting PDF scan:", error);
      res.status(500).json({ error: "Failed to delete PDF scan" });
    }
  }

  static async getAllPdfScans(req, res) {
    try {
      const pdfScans = await PdfScansService.getAllPdfScans();
      res.json(pdfScans);
    } catch (error) {
      console.error("Error fetching PDF scans:", error);
      res.status(500).json({ error: "Failed to fetch PDF scans" });
    }
  }

  static async getPdfScanById(req, res) {
    try {
      const { pdfScanId } = req.params;
      console.log(
        `[PdfScansController.getPdfScanById] pdfScanId: ${pdfScanId}`
      );

      if (!pdfScanId || pdfScanId === ":pdfScanId") {
        return res.status(400).json({ error: "pdfScanId is required" });
      }

      const pdfScan = await PdfScansService.getPdfScanById(pdfScanId);
      res.json(pdfScan);
    } catch (error) {
      if (error.message === "PDF scan not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error fetching PDF scan:", error);
      res.status(500).json({ error: "Failed to fetch PDF scan" });
    }
  }

  static async runPdfScan(req, res) {
    try {
      const { pdfScanId } = req.params;
      console.log(`[PdfScansController.runPdfScan] pdfScanId: ${pdfScanId}`);

      if (!pdfScanId || pdfScanId === ":pdfScanId") {
        return res.status(400).json({ error: "pdfScanId is required" });
      }

      const result = await PdfScansService.runPdfScan(pdfScanId);

      res.json({
        message: "PDF scan completed successfully",
        status: result.status,
        result,
      });
    } catch (error) {
      if (error.message === "PDF scan not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error running PDF scan:", error);
      res.status(500).json({ error: "Failed to run PDF scan" });
    }
  }

  static async getScanResults(req, res) {
    try {
      const { pdfScanId } = req.params;
      const results = await PdfScansService.getScanResults(pdfScanId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching scan results:", error);
      res.status(500).json({ error: "Failed to fetch scan results" });
    }
  }

  static async getScanResultById(req, res) {
    try {
      const { resultId } = req.params;
      const result = await PdfScansService.getScanResultById(resultId);
      res.json(result);
    } catch (error) {
      if (error.message === "Scan result not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error fetching scan result:", error);
      res.status(500).json({ error: "Failed to fetch scan result" });
    }
  }
}

module.exports = PdfScansController;
