import Answer from '../models/Answer.js';
import Slip from '../models/Slip.js';

// @desc    Get all answers (admin only)
// @route   GET /api/answers
// @access  Private/Admin
export const getAllAnswers = async (req, res) => {
  try {
    const answers = await Answer.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: answers.length,
      answers
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch answers',
      error: error.message
    });
  }
};

// @desc    Get public answers for bet resolution (no auth required)
// @route   GET /api/answers/public
// @access  Public
export const getPublicAnswers = async (req, res) => {
  try {
    console.log('📡 Fetching public answers for bet resolution...');
    
    // Only return necessary fields for bet resolution
    const answers = await Answer.find({}, {
      'answers.questionId': 1,
      'answers.answer': 1,
      'slipId': 1,
      'slipTitle': 1,
      'createdAt': 1
    }).sort({ createdAt: -1 });

    // Format the response to be more efficient
    const formattedAnswers = answers.map(answer => ({
      slipId: answer.slipId,
      slipTitle: answer.slipTitle,
      answers: answer.answers.map(q => ({
        questionId: q.questionId,
        answer: q.answer
      })),
      resolvedAt: answer.createdAt
    }));

    console.log(`✅ Found ${formattedAnswers.length} public answers`);

    res.status(200).json({
      success: true,
      count: formattedAnswers.length,
      answers: formattedAnswers
    });
  } catch (error) {
    console.error('❌ Get public answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch answers',
      error: error.message
    });
  }
};

// @desc    Get answers for a specific slip (public)
// @route   GET /api/answers/slip/:slipId
// @access  Public
export const getAnswersBySlip = async (req, res) => {
  try {
    const { slipId } = req.params;
    
    console.log(`📡 Fetching answers for slip: ${slipId}`);
    
    const answers = await Answer.find({ slipId })
      .sort({ createdAt: -1 })
      .limit(1); // Get the most recent answer for this slip

    if (answers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No answers found for this slip'
      });
    }

    // Format the response
    const formattedAnswers = {
      slipId: answers[0].slipId,
      slipTitle: answers[0].slipTitle,
      answers: answers[0].answers.map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: q.answer
      })),
      resolvedAt: answers[0].createdAt
    };

    console.log(`✅ Found answers for slip: ${slipId}`);

    res.status(200).json({
      success: true,
      answers: formattedAnswers
    });
  } catch (error) {
    console.error('❌ Get answers by slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch answers',
      error: error.message
    });
  }
};

// @desc    Get single answer (admin only)
// @route   GET /api/answers/:id
// @access  Private/Admin
export const getAnswerById = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Get answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch answer',
      error: error.message
    });
  }
};

// @desc    Create a new answer (for users submitting answers)
// @route   POST /api/answers
// @access  Public
export const createAnswer = async (req, res) => {
  try {
    const { slipId, userId, userName, userEmail, answers } = req.body;

    console.log('📝 Creating new answer submission:', { slipId, userId, userName });

    // Validate input
    if (!slipId || !answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get slip details
    const slip = await Slip.findById(slipId);
    
    if (!slip) {
      return res.status(404).json({
        success: false,
        message: 'Slip not found'
      });
    }

    // Calculate total price
    const totalPrice = answers.reduce((sum, ans) => sum + (ans.price || 0), 0);

    const newAnswer = await Answer.create({
      slipId,
      slipTitle: slip.title,
      slipDescription: slip.description,
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous User',
      userEmail: userEmail || '',
      answers,
      totalPrice,
      status: 'completed'
    });

    console.log('✅ Answer created successfully:', newAnswer._id);

    res.status(201).json({
      success: true,
      message: 'Answers submitted successfully',
      answer: newAnswer
    });
  } catch (error) {
    console.error('❌ Create answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answers',
      error: error.message
    });
  }
};

// @desc    Update answer status (admin only)
// @route   PUT /api/answers/:id
// @access  Private/Admin
export const updateAnswerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'reviewed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const answer = await Answer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    console.log('✅ Answer status updated:', answer._id);

    res.status(200).json({
      success: true,
      message: 'Answer status updated',
      answer
    });
  } catch (error) {
    console.error('❌ Update answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update answer',
      error: error.message
    });
  }
};

// @desc    Delete answer (admin only)
// @route   DELETE /api/answers/:id
// @access  Private/Admin
export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    await answer.deleteOne();

    console.log('✅ Answer deleted:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete answer',
      error: error.message
    });
  }
};