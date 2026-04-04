const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get all medical records for the logged-in patient
// @route   GET /api/medical-records
// @access  Private
exports.getMedicalRecords = async (req, res) => {
  try {
    // Return records WITHOUT the large fileData field for listing
    const records = await MedicalRecord.find({ patientId: req.user.id })
      .select('-fileData')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get Medical Records Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload a medical record
// @route   POST /api/medical-records
// @access  Private (Patient)
exports.uploadMedicalRecord = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // 10 MB limit
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }

    const record = await MedicalRecord.create({
      patientId: req.user.id,
      fileName: `${Date.now()}-${originalname}`,
      originalName: originalname,
      mimeType: mimetype,
      fileSize: size,
      fileData: buffer.toString('base64')
    });

    // Return without file data
    const response = record.toObject();
    delete response.fileData;

    res.status(201).json(response);
  } catch (error) {
    console.error('Upload Medical Record Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download a medical record (original file)
// @route   GET /api/medical-records/:id/download
// @access  Private
exports.downloadMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patientId: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const fileBuffer = Buffer.from(record.fileData, 'base64');

    res.set({
      'Content-Type': record.mimeType,
      'Content-Disposition': `attachment; filename="${record.originalName}"`,
      'Content-Length': fileBuffer.length
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error('Download Medical Record Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
// @access  Private
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete Medical Record Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
