const RefillRequest = require('../models/RefillRequest');
const User = require('../models/User');

// @desc    Get refill requests for doctor
// @route   GET /api/refills
// @access  Private
exports.getRefillRequests = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const requests = await RefillRequest.find({ doctorId, status: 'pending' })
      .populate('patientId', 'name email')
      .sort({ requestedDate: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update refill request status (Approve/Reject)
// @route   PATCH /api/refills/:id
// @access  Private
exports.updateRefillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.user.id;

    const request = await RefillRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Refill request not found' });
    }

    if (request.doctorId.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = status;
    request.notes = notes;
    if (status === 'approved') request.approvedAt = new Date();
    if (status === 'rejected') request.rejectedAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: `Refill request ${status}`,
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create refill request (Patient)
// @route   POST /api/refills
// @access  Private
exports.createRefillRequest = async (req, res) => {
  try {
    const { doctorId, medicationName, dosage, frequency, notes } = req.body;
    const patientId = req.user.id;

    const request = await RefillRequest.create({
      patientId,
      doctorId,
      medicationName,
      dosage,
      frequency,
      notes
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
