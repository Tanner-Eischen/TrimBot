import React from 'react';

export interface ProjectSetupProps {
  onCreateProject: () => Promise<void>;
  isLoading: boolean;
}

declare const ProjectSetup: React.FC<ProjectSetupProps>;
export default ProjectSetup;