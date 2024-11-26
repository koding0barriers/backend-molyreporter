const { connectDatabase } = require("../dao/database");
const { ObjectId } = require("mongodb");

class PdfScan {
  // Handling PDFs uploaded by users
  static async create(pdfScanData) {
    const db = await connectDatabase();
    return await db.collection("pdf_scans").insertOne({
      uploadDate: new Date(),
      ...pdfScanData,
    });
  }

  static async update(pdfScanId, updateData) {
    const db = await connectDatabase();
    return await db.collection("pdf_scans").updateOne(
      { _id: ObjectId.createFromHexString(pdfScanId) },
      {
        $set: {
          ...updateData,
        },
      }
    );
  }

  static async findById(pdfScanId) {
    const db = await connectDatabase();
    return await db.collection("pdf_scans").findOne({
      _id: ObjectId.createFromHexString(pdfScanId),
    });
  }

  static async findAll() {
    const db = await connectDatabase();
    return await db.collection("pdf_scans").find().toArray();
  }

  static async findAllByUser(username) {
    const db = await connectDatabase();
    return await db
      .collection("pdf_scans")
      .find({ authorUsername: username })
      .project({ fileData: 0 }) // Exclude file data from results
      .toArray();
  }

  static async deleteById(pdfScanId) {
    const db = await connectDatabase();
    return await db.collection("pdf_scans").deleteOne({
      _id: ObjectId.createFromHexString(pdfScanId),
    });
  }

  // Handling PDF scan results
  static async createScanResult(scanResultData) {
    const db = await connectDatabase();
    return await db.collection("pdf_scan_results").insertOne({
      createdAt: new Date(),
      lastModified: new Date(),
      ...scanResultData,
    });
  }

  static async updateScanResult(resultId, updateData) {
    const db = await connectDatabase();
    return await db.collection("pdf_scan_results").updateOne(
      { _id: ObjectId.createFromHexString(resultId) },
      {
        $set: {
          lastModified: new Date(),
          ...updateData,
        },
      }
    );
  }

  static async findScanResults(pdfScanId) {
    const db = await connectDatabase();
    return await db
      .collection("pdf_scan_results")
      .find({ pdfScanId: pdfScanId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findScanResultById(resultId) {
    const db = await connectDatabase();
    return await db.collection("pdf_scan_results").findOne({
      _id: ObjectId.createFromHexString(resultId),
    });
  }
}

module.exports = PdfScan;
