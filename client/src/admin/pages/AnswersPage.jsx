import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { 
  CheckSquare, 
  FileText, 
  User, 
  Calendar,
  Search,
  ThumbsUp,
  ThumbsDown,
  Save,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Edit2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AnswersPage = () => {
  const [slips, setSlips] = useState([]);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedAnswers, setExpandedAnswers] = useState({});
  
  // Edit states
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [editAnswers, setEditAnswers] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch slips
      const slipsResponse = await axios.get('https://freehit.onrender.com/api/slips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlips(slipsResponse.data.slips || []);
      
      // Fetch submitted answers
      const answersResponse = await axios.get('https://freehit.onrender.com/api/answers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmittedAnswers(answersResponse.data.answers || []);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlip = (slip) => {
    setSelectedSlip(slip);
    // Initialize answers object for this slip
    const initialAnswers = {};
    slip.questions.forEach((q, index) => {
      initialAnswers[index] = null;
    });
    setAnswers(initialAnswers);
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const calculateTotal = (questions, answersData) => {
    return questions.reduce((total, q, index) => {
      const answer = answersData[index];
      if (answer === true) return total + (q.yesPrice || 0);
      if (answer === false) return total + (q.noPrice || 0);
      return total;
    }, 0);
  };

  const handleSubmitAnswers = async () => {
    // Check if all questions are answered
    const allAnswered = Object.values(answers).every(a => a !== null);
    
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Format answers for submission
      const formattedAnswers = selectedSlip.questions.map((q, index) => ({
        questionId: q._id,
        question: q.question,
        answerType: q.answerType,
        answer: answers[index],
        yesPrice: q.yesPrice || 0,
        noPrice: q.noPrice || 0,
        price: answers[index] === true ? (q.yesPrice || 0) : (q.noPrice || 0)
      }));

      const answerData = {
        slipId: selectedSlip._id,
        slipTitle: selectedSlip.title,
        slipDescription: selectedSlip.description,
        userName: 'Admin',
        userEmail: 'admin@freehit.com',
        answers: formattedAnswers,
        totalPrice: calculateTotal(selectedSlip.questions, answers),
        status: 'completed'
      };

      const response = await axios.post(
        'https://freehit.onrender.com/api/answers',
        answerData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Answers submitted successfully!');
        
        // Refresh data
        fetchData();
        
        // Reset form
        setSelectedSlip(null);
        setAnswers({});
        
        // Switch to answered tab
        setActiveTab('answered');
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      toast.error('Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedSlip(null);
    setAnswers({});
  };

  // Edit functions
  const startEditing = (answer) => {
    setEditingAnswer(answer);
    // Initialize edit answers from existing answers
    const editData = {};
    answer.answers.forEach((ans, index) => {
      editData[index] = ans.answer;
    });
    setEditAnswers(editData);
  };

  const cancelEditing = () => {
    setEditingAnswer(null);
    setEditAnswers({});
  };

  const handleEditAnswerChange = (questionIndex, value) => {
    setEditAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const calculateEditTotal = () => {
    if (!editingAnswer) return 0;
    
    return editingAnswer.answers.reduce((total, ans, index) => {
      const answer = editAnswers[index];
      if (answer === true) return total + (ans.yesPrice || 0);
      if (answer === false) return total + (ans.noPrice || 0);
      return total;
    }, 0);
  };

  const saveEditedAnswer = async () => {
    // Check if all questions are answered
    const allAnswered = Object.values(editAnswers).every(a => a !== null);
    
    if (!allAnswered) {
      toast.error('Please answer all questions before saving');
      return;
    }

    setEditLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Format updated answers
      const formattedAnswers = editingAnswer.answers.map((ans, index) => ({
        ...ans,
        answer: editAnswers[index],
        price: editAnswers[index] === true ? (ans.yesPrice || 0) : (ans.noPrice || 0)
      }));

      const updatedAnswerData = {
        ...editingAnswer,
        answers: formattedAnswers,
        totalPrice: calculateEditTotal()
      };

      const response = await axios.put(
        `https://freehit.onrender.com/api/answers/${editingAnswer._id}`,
        updatedAnswerData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Answers updated successfully!');
        
        // Update local state
        setSubmittedAnswers(prev => 
          prev.map(a => a._id === editingAnswer._id ? response.data.answer : a)
        );
        
        // Exit edit mode
        setEditingAnswer(null);
        setEditAnswers({});
      }
    } catch (error) {
      console.error('Failed to update answers:', error);
      toast.error('Failed to update answers');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleExpand = (answerId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnswerIcon = (answer) => {
    if (answer === true) return <ThumbsUp className="w-4 h-4 text-green-600" />;
    if (answer === false) return <ThumbsDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getAnswerText = (answer) => {
    if (answer === true) return 'Yes';
    if (answer === false) return 'No';
    return answer || 'Not answered';
  };

  // Filter pending slips (not answered yet)
  const answeredSlipIds = new Set(submittedAnswers.map(a => a.slipId));
  const pendingSlips = slips.filter(slip => !answeredSlipIds.has(slip._id));
  
  // Filter pending slips based on search
  const filteredPendingSlips = pendingSlips.filter(slip => 
    slip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter submitted answers based on search
  const filteredAnswers = submittedAnswers.filter(answer => {
    return (
      answer.slipTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate stats
  const stats = {
    totalSlips: slips.length,
    answeredSlips: submittedAnswers.length,
    pendingSlips: pendingSlips.length,
    totalValue: submittedAnswers.reduce((sum, a) => sum + (a.totalPrice || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Answers Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {selectedSlip ? `Answering: ${selectedSlip.title}` : 'View and manage answers'}
          </p>
        </div>

        {/* Stats Cards */}
        {!selectedSlip && !editingAnswer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Total Slips</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSlips}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Answered</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.answeredSlips}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingSlips}</p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Total Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">₹{stats.totalValue}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                  <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search - Only show when no slip selected and not editing */}
        {!selectedSlip && !editingAnswer && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search slips or answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Tabs - Only show when no slip selected and not editing */}
        {!selectedSlip && !editingAnswer && (
          <div className="flex space-x-2 mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending ({pendingSlips.length})
            </button>
            <button
              onClick={() => setActiveTab('answered')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'answered'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Answered ({submittedAnswers.length})
            </button>
          </div>
        )}

        {/* Edit Mode */}
        {editingAnswer ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Editing: {editingAnswer.slipTitle}
                  </h2>
                  <p className="text-sm text-gray-600">Edit answers below</p>
                </div>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  Edit Mode
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              {editingAnswer.answers.map((ans, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-medium text-gray-900 mb-3">
                    Q{index + 1}: {ans.question}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    {/* Yes Option */}
                    <button
                      onClick={() => handleEditAnswerChange(index, true)}
                      className={`flex items-center justify-between sm:justify-start space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        editAnswers[index] === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className={`w-4 h-4 ${
                          editAnswers[index] === true ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm sm:text-base font-medium">Yes</span>
                      </div>
                      <span className="text-sm font-bold text-green-600 ml-4">+₹{ans.yesPrice || 0}</span>
                    </button>

                    {/* No Option */}
                    <button
                      onClick={() => handleEditAnswerChange(index, false)}
                      className={`flex items-center justify-between sm:justify-start space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        editAnswers[index] === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className={`w-4 h-4 ${
                          editAnswers[index] === false ? 'text-red-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm sm:text-base font-medium">No</span>
                      </div>
                      <span className="text-sm font-bold text-red-600 ml-4">+₹{ans.noPrice || 0}</span>
                    </button>
                  </div>

                  {/* Current Answer Indicator */}
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Current:</span>
                    <div className="flex items-center space-x-1">
                      {getAnswerIcon(ans.answer)}
                      <span className={`text-xs font-medium ${
                        ans.answer === true ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getAnswerText(ans.answer)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Actions */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <span className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-0">New Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-purple-600">₹{calculateEditTotal()}</span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                <button
                  onClick={cancelEditing}
                  className="w-full sm:flex-1 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedAnswer}
                  disabled={editLoading}
                  className="w-full sm:flex-1 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : selectedSlip ? (
          // Answer Form (existing code)
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            {/* ... existing answer form code ... */}
            <div className="mb-4 sm:mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{selectedSlip.title}</h2>
              <p className="text-sm sm:text-base text-gray-600">{selectedSlip.description}</p>
            </div>

            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              {selectedSlip.questions.map((q, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-medium text-gray-900 mb-3">
                    Q{index + 1}: {q.question}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    <button
                      onClick={() => handleAnswerChange(index, true)}
                      className={`flex items-center justify-between sm:justify-start space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        answers[index] === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className={`w-4 h-4 ${
                          answers[index] === true ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm sm:text-base font-medium">Yes</span>
                      </div>
                      <span className="text-sm font-bold text-green-600 ml-4">+₹{q.yesPrice || 0}</span>
                    </button>

                    <button
                      onClick={() => handleAnswerChange(index, false)}
                      className={`flex items-center justify-between sm:justify-start space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        answers[index] === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className={`w-4 h-4 ${
                          answers[index] === false ? 'text-red-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm sm:text-base font-medium">No</span>
                      </div>
                      <span className="text-sm font-bold text-red-600 ml-4">+₹{q.noPrice || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <span className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-0">Total Amount:</span>
                <span className="text-xl sm:text-2xl font-bold text-purple-600">₹{calculateTotal(selectedSlip.questions, answers)}</span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                <button
                  onClick={handleCancel}
                  className="w-full sm:flex-1 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAnswers}
                  disabled={submitting}
                  className="w-full sm:flex-1 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Submit Answers</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // List View based on active tab
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            ) : activeTab === 'pending' ? (
              // Pending Slips List
              filteredPendingSlips.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">No pending slips found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPendingSlips.map((slip) => (
                    <div
                      key={slip._id}
                      onClick={() => handleSelectSlip(slip)}
                      className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 flex-1">
                            {slip.title}
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-500 ml-2">
                            {slip.questions?.length || 0} Q
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {slip.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Total: ₹{slip.totalPrice || 0}</span>
                          <span className="text-yellow-600">Pending</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Answered Slips List with Edit Option
              filteredAnswers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <CheckSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">No answered slips found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAnswers.map((answer) => (
                    <div key={answer._id} className="p-3 sm:p-4">
                      <div className="space-y-2">
                        {/* Header with Edit Button */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{answer.userName}</p>
                              <p className="text-xs text-gray-500">{answer.slipTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEditing(answer)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Answer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleExpand(answer._id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {expandedAnswers[answer._id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Date and Total */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{formatDate(answer.createdAt)}</span>
                          <span className="font-bold text-purple-600">₹{answer.totalPrice}</span>
                        </div>

                        {/* Expanded Answers */}
                        {expandedAnswers[answer._id] && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <p className="text-xs font-medium text-gray-500 mb-2">Answers:</p>
                            {answer.answers?.map((ans, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  Q{idx + 1}: {ans.question}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getAnswerIcon(ans.answer)}
                                    <span className={`text-xs font-medium ${
                                      ans.answer === true ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {getAnswerText(ans.answer)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-purple-600">
                                    ₹{ans.price}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswersPage;
