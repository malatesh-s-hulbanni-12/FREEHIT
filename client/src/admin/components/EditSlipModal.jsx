import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const EditSlipModal = ({ isOpen, onClose, slip, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (slip) {
      setTitle(slip.title || '');
      setDescription(slip.description || '');
      setQuestions(slip.questions || []);
    }
  }, [slip]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        answerType: 'yes/no',
        yesPrice: 0,
        noPrice: 0
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('At least one question is required');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return questions.reduce((total, q) => {
      return total + (parseFloat(q.yesPrice) || 0) + (parseFloat(q.noPrice) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate questions
    for (let q of questions) {
      if (!q.question.trim()) {
        toast.error('All questions must have text');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(
        `https://freehit.onrender.com/api/slips/${slip._id}`,
        { 
          title,
          description,
          questions 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        toast.success('Slip updated successfully!');
        onSuccess(response.data.slip);
        onClose();
      }
    } catch (error) {
      console.error('Update slip error:', error);
      toast.error(error.response?.data?.message || 'Failed to update slip');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg my-4 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Edit Slip</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title and Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Slip Title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Slip Description"
              rows="2"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Questions List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Question {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Question Input */}
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  placeholder="Enter your question"
                  className="w-full px-3 py-2 mb-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required
                />

                {/* Answer Type and Pricing */}
                <div className="space-y-2">
                  <select
                    value={q.answerType}
                    onChange={(e) => handleQuestionChange(index, 'answerType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                  >
                    <option value="yes/no">Yes/No Type</option>
                    <option value="text">Text Type</option>
                    <option value="number">Number Type</option>
                  </select>

                  {q.answerType === 'yes/no' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Yes Price (₹)</label>
                        <input
                          type="number"
                          value={q.yesPrice}
                          onChange={(e) => handleQuestionChange(index, 'yesPrice', e.target.value)}
                          min="0"
                          step="1"
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">No Price (₹)</label>
                        <input
                          type="number"
                          value={q.noPrice}
                          onChange={(e) => handleQuestionChange(index, 'noPrice', e.target.value)}
                          min="0"
                          step="1"
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={q.yesPrice}
                        onChange={(e) => {
                          handleQuestionChange(index, 'yesPrice', e.target.value);
                          handleQuestionChange(index, 'noPrice', e.target.value);
                        }}
                        min="0"
                        step="1"
                        placeholder="Enter price"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Question</span>
            </button>
          </div>

          {/* Total Price */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Price:</span>
              <span className="text-lg font-bold text-purple-700">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Slip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSlipModal;
