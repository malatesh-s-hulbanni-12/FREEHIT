import React from 'react';
import { X, CheckCircle, XCircle, User, Calendar, FileText, DollarSign } from 'lucide-react';

const ViewAnswerModal = ({ isOpen, onClose, answer }) => {
  if (!isOpen || !answer) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnswerDisplay = (ans) => {
    if (typeof ans === 'boolean') {
      return ans ? 'Yes' : 'No';
    }
    return ans || 'Not answered';
  };

  const getAnswerIcon = (ans) => {
    if (ans === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (ans === false) return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl my-4 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Answer Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{answer.userName || 'Anonymous User'}</p>
                <p className="text-sm text-gray-600">{answer.userEmail}</p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(answer.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Slip Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">{answer.slipTitle}</h3>
            </div>
            <p className="text-sm text-gray-600">{answer.slipDescription}</p>
          </div>

          {/* Answers List */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Answers</h3>
            <div className="space-y-3">
              {answer.answers?.map((ans, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Q{index + 1}: {ans.question}
                      </p>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getAnswerIcon(ans.answer)}
                          <span className="text-sm font-medium text-gray-700">
                            {getAnswerDisplay(ans.answer)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-purple-600">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-sm font-bold">₹{ans.price || 0}</span>
                        </div>
                      </div>

                      {ans.answerType === 'yes/no' && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="mr-3">Yes Price: ₹{ans.yesPrice}</span>
                          <span>No Price: ₹{ans.noPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-xl font-bold text-purple-700">₹{answer.totalPrice || 0}</span>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAnswerModal;