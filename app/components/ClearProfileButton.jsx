import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

function ClearProfileButton({ onClear, onRevert, canRevert }) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingRevert, setConfirmingRevert] = useState(false);

  return (
    <div className="space-y-4 mt-8 max-w-sm mx-auto">
      {/* Clear Profile Section */}
      {!confirmingClear ? (
        <button
          onClick={() => setConfirmingClear(true)}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 flex justify-center items-center space-x-2"
          aria-label="Clear Profile and Start Fresh"
        >
          <Trash2 className="w-5 h-5" />
          <span>Clear Profile & Start Fresh</span>
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md flex flex-col items-center space-y-3">
          <p className="text-red-700 font-semibold text-center">
            Clear profile will delete all current data and start fresh. This action cannot be undone.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={onClear}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              aria-label="Confirm Clear Profile"
            >
              Confirm Clear
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              aria-label="Cancel Clear Profile"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Revert to old profile section */}
      {canRevert && (
        !confirmingRevert ? (
          <button
            onClick={() => setConfirmingRevert(true)}
            className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 flex justify-center items-center space-x-2"
            aria-label="Revert to Old Profile"
          >
            <Trash2 className="w-5 h-5" />
            <span>Revert to Old Profile</span>
          </button>
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md flex flex-col items-center space-y-3">
            <p className="text-yellow-700 font-semibold text-center">
              Reverting will restore your previous profile data.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={onRevert}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                aria-label="Confirm Revert Profile"
              >
                Confirm Revert
              </button>
              <button
                onClick={() => setConfirmingRevert(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                aria-label="Cancel Revert Profile"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default ClearProfileButton;
