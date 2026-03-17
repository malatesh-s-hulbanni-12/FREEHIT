import Slip from '../models/Slip.js';

// @desc    Create a new slip
// @route   POST /api/slips
// @access  Private/Admin
export const createSlip = async (req, res) => {
  try {
    const { questions } = req.body;

    console.log('Creating slip with questions:', questions);

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
    }

    // Validate each question
    for (let q of questions) {
      if (!q.question || q.question.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'All questions must have text'
        });
      }
    }

    // Calculate total price
    const totalPrice = questions.reduce((total, q) => {
      return total + (parseFloat(q.yesPrice) || 0) + (parseFloat(q.noPrice) || 0);
    }, 0);

    // Create slip with default title and description for admin
    const slipData = {
      title: 'Admin Slip', // Default title
      description: 'Created by admin', // Default description
      questions,
      totalPrice,
      status: 'active', // IMPORTANT: Set status to active
      createdBy: req.user?.id || 'admin' // Handle both user and admin
    };

    console.log('Creating slip with data:', slipData);

    const slip = await Slip.create(slipData);

    res.status(201).json({
      success: true,
      message: 'Slip created successfully',
      slip
    });
  } catch (error) {
    console.error('Create slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create slip',
      error: error.message,
      details: error.errors // Send validation details for debugging
    });
  }
};

// @desc    Get all slips
// @route   GET /api/slips
// @access  Private/Admin
export const getAllSlips = async (req, res) => {
  try {
    const slips = await Slip.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: slips.length,
      slips
    });
  } catch (error) {
    console.error('Get slips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slips',
      error: error.message
    });
  }
};

// @desc    Get slip statistics
// @route   GET /api/slips/stats
// @access  Private/Admin
export const getSlipStats = async (req, res) => {
  try {
    const totalSlips = await Slip.countDocuments();
    const activeSlips = await Slip.countDocuments({ status: 'active' });
    
    const totalValue = await Slip.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalSlips,
        activeSlips,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get slip stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slip statistics',
      error: error.message
    });
  }
};

// @desc    Delete slip
// @route   DELETE /api/slips/:id
// @access  Private/Admin
export const deleteSlip = async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);

    if (!slip) {
      return res.status(404).json({
        success: false,
        message: 'Slip not found'
      });
    }

    await slip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Slip deleted successfully'
    });
  } catch (error) {
    console.error('Delete slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete slip',
      error: error.message
    });
  }
};

// @desc    Get active slips for betting
// @route   GET /api/slips/active
// @access  Public
export const getActiveSlips = async (req, res) => {
  try {
    console.log('📡 Fetching active slips...');
    
    // Get all active slips with their questions
    const slips = await Slip.find({ 
      status: 'active',
      'questions.0': { $exists: true } // Only get slips that have at least one question
    })
    .select('title description questions totalPrice status createdAt')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${slips.length} active slips with questions`);
    
    // Log each slip for debugging
    slips.forEach((slip, index) => {
      console.log(`Slip ${index + 1}:`, {
        id: slip._id,
        title: slip.title,
        questionsCount: slip.questions?.length || 0,
        status: slip.status
      });
    });

    res.status(200).json({
      success: true,
      count: slips.length,
      slips
    });
  } catch (error) {
    console.error('❌ Get active slips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active slips',
      error: error.message
    });
  }
};

// @desc    Debug endpoint to check all slips
// @route   GET /api/slips/debug
// @access  Public (for debugging only)
export const debugSlips = async (req, res) => {
  try {
    const allSlips = await Slip.find({});
    const activeSlips = await Slip.find({ status: 'active' });
    const slipsWithQuestions = await Slip.find({ 'questions.0': { $exists: true } });
    
    res.status(200).json({
      success: true,
      totalSlips: allSlips.length,
      activeSlips: activeSlips.length,
      slipsWithQuestions: slipsWithQuestions.length,
      allSlips: allSlips.map(s => ({
        id: s._id,
        title: s.title,
        status: s.status,
        questionsCount: s.questions?.length || 0,
        hasQuestions: s.questions && s.questions.length > 0
      })),
      activeSlipsData: activeSlips
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};