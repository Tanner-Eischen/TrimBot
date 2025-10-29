/**
 * Centralized toast message utilities for consistent user feedback
 */
import { toast } from 'sonner';

// Project-related messages
export const projectToasts = {
  creating: () => toast.loading('Creating project...', { id: 'project-create' }),
  created: () => toast.success('Project created successfully!', { id: 'project-create' }),
  createFailed: (error) => toast.error(`Failed to create project: ${error}`, { id: 'project-create' }),
  
  loading: () => toast.loading('Loading project...', { id: 'project-load' }),
  loaded: () => toast.success('Project loaded successfully!', { id: 'project-load' }),
  loadFailed: (error) => toast.error(`Failed to load project: ${error}`, { id: 'project-load' }),
};

// Import-related messages
export const importToasts = {
  importing: (count) => toast.loading(`Importing ${count} file${count > 1 ? 's' : ''}...`, { id: 'import' }),
  imported: (count) => toast.success(`Successfully imported ${count} file${count > 1 ? 's' : ''}!`, { id: 'import' }),
  importFailed: (error) => toast.error(`Import failed: ${error}`, { id: 'import' }),
  
  probing: (filename) => toast.loading(`Analyzing ${filename}...`, { id: 'probe' }),
  probed: (filename) => toast.success(`${filename} ready for editing`, { id: 'probe' }),
  probeFailed: (filename, error) => toast.error(`Failed to analyze ${filename}: ${error}`, { id: 'probe' }),
  
  converting: (filename) => toast.loading(`Converting ${filename} to MP4...`, { id: 'convert' }),
  conversionComplete: (filename) => toast.success(`${filename} converted to MP4 successfully`, { id: 'convert' }),
  conversionFailed: (filename, error) => toast.error(`Failed to convert ${filename}: ${error}`, { id: 'convert' }),
  
  unsupportedFormat: (filename) => toast.error(`Unsupported file format: ${filename}`, { duration: 5000 }),
  fileTooLarge: (filename, size) => toast.error(`File too large: ${filename} (${size})`, { duration: 5000 }),
};

// Recording-related messages
export const recordingToasts = {
  // Screen recording
  screenStarting: () => toast.loading('Starting screen recording...', { id: 'screen-recording' }),
  screenStarted: () => toast.success('Screen recording started', { id: 'screen-recording' }),
  screenStartFailed: (error) => toast.error(`Failed to start screen recording: ${error}`, { id: 'screen-recording' }),
  
  screenSaving: () => toast.loading('Saving screen recording...', { id: 'screen-recording' }),
  screenSaved: () => toast.success('Screen recording saved successfully!', { id: 'screen-recording' }),
  screenSaveFailed: (error) => toast.error(`Failed to save screen recording: ${error}`, { id: 'screen-recording' }),
  
  screenTranscoding: () => toast.loading('Converting to MP4...', { id: 'screen-recording' }),
  screenCompleted: () => toast.success('Screen recording completed successfully!', { id: 'screen-recording' }),
  
  // Webcam recording
  webcamStarting: () => toast.loading('Starting webcam recording...', { id: 'webcam-recording' }),
  webcamStarted: () => toast.success('Webcam recording started', { id: 'webcam-recording' }),
  webcamStartFailed: (error) => toast.error(`Failed to start webcam recording: ${error}`, { id: 'webcam-recording' }),
  
  webcamSaving: () => toast.loading('Saving webcam recording...', { id: 'webcam-recording' }),
  webcamSaved: () => toast.success('Webcam recording saved successfully!', { id: 'webcam-recording' }),
  webcamSaveFailed: (error) => toast.error(`Failed to save webcam recording: ${error}`, { id: 'webcam-recording' }),
  
  webcamTranscoding: () => toast.loading('Converting to MP4...', { id: 'webcam-recording' }),
  webcamCompleted: () => toast.success('Webcam recording completed successfully!', { id: 'webcam-recording' }),
  
  // Permission issues
  permissionDenied: (type) => toast.error(`${type} permission denied. Please allow access and try again.`, { duration: 5000 }),
  deviceNotFound: (type) => toast.error(`No ${type} device found. Please check your hardware.`, { duration: 5000 }),
};

// Editing-related messages
export const editingToasts = {
  trimming: (filename) => toast.loading(`Trimming ${filename}...`, { id: 'trim' }),
  trimmed: (filename) => toast.success(`${filename} trimmed successfully!`, { id: 'trim' }),
  trimFailed: (filename, error) => toast.error(`Failed to trim ${filename}: ${error}`, { id: 'trim' }),
  
  addedToTimeline: (filename) => toast.success(`Added ${filename} to timeline`, { duration: 2000 }),
  removedFromTimeline: (filename) => toast.success(`Removed ${filename} from timeline`, { duration: 2000 }),
  timelineReordered: () => toast.success('Timeline reordered', { duration: 1500 }),
  
  invalidTrimRange: () => toast.error('Invalid trim range. End time must be after start time.', { duration: 4000 }),
  trimRangeTooShort: () => toast.error('Trim range too short. Minimum duration is 0.1 seconds.', { duration: 4000 }),
};

// Export-related messages
export const exportToasts = {
  starting: () => toast.loading('Starting export...', { id: 'export' }),
  processing: () => toast.loading('Processing video...', { id: 'export' }),
  completed: (filename) => toast.success(`Export completed: ${filename}`, { id: 'export' }),
  failed: (error) => toast.error(`Export failed: ${error}`, { id: 'export' }),
  
  retryingWithFallback: () => toast.loading('Retrying with alternative method...', { id: 'export' }),
  fallbackSuccess: (filename) => toast.success(`Export completed using fallback method: ${filename}`, { id: 'export' }),
  
  emptyTimeline: () => toast.error('Cannot export empty timeline. Add clips first.', { duration: 4000 }),
  invalidSettings: () => toast.error('Invalid export settings. Please check your configuration.', { duration: 4000 }),
};

// System-related messages
export const systemToasts = {
  ffmpegNotFound: () => toast.error('FFmpeg not found. Please ensure FFmpeg is properly installed.', { duration: 6000 }),
  diskSpaceLow: () => toast.warning('Low disk space. Consider freeing up space before continuing.', { duration: 5000 }),
  
  browserMode: () => toast.info('Running in browser mode. Some features may be limited.', { duration: 4000 }),
  desktopMode: () => toast.success('Desktop mode active. All features available.', { duration: 3000 }),
  
  autoSaved: () => toast.success('Project auto-saved', { duration: 1500 }),
  autoSaveFailed: () => toast.error('Auto-save failed', { duration: 3000 }),
};

// File operation messages
export const fileToasts = {
  copying: (filename) => toast.loading(`Copying ${filename}...`, { id: 'file-copy' }),
  copied: (filename) => toast.success(`${filename} copied successfully`, { id: 'file-copy' }),
  copyFailed: (filename, error) => toast.error(`Failed to copy ${filename}: ${error}`, { id: 'file-copy' }),
  
  deleting: (filename) => toast.loading(`Deleting ${filename}...`, { id: 'file-delete' }),
  deleted: (filename) => toast.success(`${filename} deleted`, { id: 'file-delete' }),
  deleteFailed: (filename, error) => toast.error(`Failed to delete ${filename}: ${error}`, { id: 'file-delete' }),
  
  accessDenied: (filename) => toast.error(`Access denied: ${filename}`, { duration: 4000 }),
  fileNotFound: (filename) => toast.error(`File not found: ${filename}`, { duration: 4000 }),
};

// Validation messages
export const validationToasts = {
  invalidFilename: () => toast.error('Invalid filename. Please use only letters, numbers, and basic punctuation.', { duration: 4000 }),
  filenameTooLong: () => toast.error('Filename too long. Please use a shorter name.', { duration: 4000 }),
  
  invalidProjectPath: () => toast.error('Invalid project path. Please select a valid directory.', { duration: 4000 }),
  projectPathNotEmpty: () => toast.warning('Selected directory is not empty. Existing files may be overwritten.', { duration: 5000 }),
};

// Generic utility functions
export const showError = (message, duration = 4000) => {
  toast.error(message, { duration });
};

export const showSuccess = (message, duration = 3000) => {
  toast.success(message, { duration });
};

export const showWarning = (message, duration = 4000) => {
  toast.warning(message, { duration });
};

export const showInfo = (message, duration = 3000) => {
  toast.info(message, { duration });
};

export const showLoading = (message, id) => {
  return toast.loading(message, { id });
};

export const dismissToast = (id) => {
  toast.dismiss(id);
};