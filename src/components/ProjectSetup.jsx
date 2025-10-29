import React from 'react';
import { FolderOpen, Plus, Video, Scissors, Download } from 'lucide-react';

export const ProjectSetup = ({ onCreateProject, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <div className="text-center mb-6">
          <FolderOpen className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TrimBot</h1>
          <p className="text-gray-600 mb-6">
            Your simple, powerful video editing companion. Create professional videos with ease.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Video className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Import &amp; Preview</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Scissors className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Trim &amp; Edit</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Download className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Export &amp; Share</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onCreateProject}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isLoading ? 'Creating Project...' : 'Create New Project'}
          </button>
          
          <div className="text-center text-sm text-gray-500 space-y-1">
            <div>Choose a folder where your project files will be stored</div>
            <div className="text-xs">• Media files • Exports • Project settings</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;