const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getMedicalRecords,
  uploadMedicalRecord,
  downloadMedicalRecord,
  deleteMedicalRecord
} = require('../controllers/medicalRecordController');
const { auth } = require('../middleware/auth');

// Use memory storage so file buffer is available in req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX'), false);
    }
  }
});

router.use(auth);

router.route('/')
  .get(getMedicalRecords)
  .post(upload.single('file'), uploadMedicalRecord);

router.get('/:id/download', downloadMedicalRecord);
router.delete('/:id', deleteMedicalRecord);

module.exports = router;
