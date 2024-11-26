const PdfScan = require("../models/PdfScan");

class PdfScansRepo {
  async create(pdfScanData) {
    const result = await PdfScan.create(pdfScanData);
    return { ...pdfScanData, insertedId: result.insertedId };
  }

  async update(pdfScanId, updateData) {
    const result = await PdfScan.update(pdfScanId, updateData);
    return result.modifiedCount > 0;
  }

  async findById(pdfScanId) {
    return await PdfScan.findById(pdfScanId);
  }

  async findAll() {
    return await PdfScan.findAll();
  }

  async findAllByUser(userId) {
    return await PdfScan.findAllByUser(userId);
  }

  async deleteById(pdfScanId) {
    const result = await PdfScan.deleteById(pdfScanId);
    return result.deletedCount > 0;
  }

  async createScanResult(scanResultData) {
    const result = await PdfScan.createScanResult(scanResultData);
    return { ...scanResultData, insertedId: result.insertedId };
  }

  async updateScanResult(resultId, updateData) {
    const result = await PdfScan.updateScanResult(resultId, updateData);
    return result.modifiedCount > 0;
  }

  async findScanResults(pdfScanId) {
    return await PdfScan.findScanResults(pdfScanId);
  }

  async findScanResultById(resultId) {
    return await PdfScan.findScanResultById(resultId);
  }
}

module.exports = new PdfScansRepo();
