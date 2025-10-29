# Manual Testing Checklist for PR-04: Playback & Preview Enhancements

## Overview
This checklist covers manual testing scenarios for the playback and preview enhancements. Complete each test case and check off when verified.

## 1. Continuous Timeline Playback

### Basic Playback
- [ ] **Test 1.1**: Load multiple clips into timeline
- [ ] **Test 1.2**: Click play button - should start continuous playback
- [ ] **Test 1.3**: Verify seamless transition between clips
- [ ] **Test 1.4**: Verify audio/video sync maintained across clips
- [ ] **Test 1.5**: Pause during playback - should stop immediately
- [ ] **Test 1.6**: Resume playback - should continue from pause point

### Edge Cases
- [ ] **Test 1.7**: Start playback from middle of timeline
- [ ] **Test 1.8**: Start playback from last clip
- [ ] **Test 1.9**: Handle empty timeline gracefully
- [ ] **Test 1.10**: Handle single clip timeline
- [ ] **Test 1.11**: Verify playback stops at end of timeline

## 2. Playhead Sync & Scrubbing

### Playhead Movement
- [ ] **Test 2.1**: Playhead moves smoothly during playback
- [ ] **Test 2.2**: Playhead position matches video time
- [ ] **Test 2.3**: Playhead auto-scrolls timeline when needed
- [ ] **Test 2.4**: Playhead visible at all zoom levels

### Scrubbing Functionality
- [ ] **Test 2.5**: Click timeline to seek - playhead jumps to position
- [ ] **Test 2.6**: Drag playhead - smooth scrubbing with visual feedback
- [ ] **Test 2.7**: Scrubbing shows time tooltip
- [ ] **Test 2.8**: Scrubbing updates video preview in real-time
- [ ] **Test 2.9**: Release playhead - video seeks to new position
- [ ] **Test 2.10**: Scrubbing works across clip boundaries

### Visual Feedback
- [ ] **Test 2.11**: Playhead changes color when dragging
- [ ] **Test 2.12**: Time display updates during scrubbing
- [ ] **Test 2.13**: Cursor changes to resize when hovering playhead

## 3. Enhanced Playback Controls UI

### Control Buttons
- [ ] **Test 3.1**: Play button starts playback
- [ ] **Test 3.2**: Pause button stops playback
- [ ] **Test 3.3**: Skip back button jumps back 10 seconds
- [ ] **Test 3.4**: Skip forward button jumps forward 10 seconds
- [ ] **Test 3.5**: Button states update correctly (play/pause icon)

### Time Display
- [ ] **Test 3.6**: Current time displays correctly (MM:SS format)
- [ ] **Test 3.7**: Total duration displays correctly
- [ ] **Test 3.8**: Time updates in real-time during playback
- [ ] **Test 3.9**: Time format handles hours correctly (HH:MM:SS)

### Playback Speed Control
- [ ] **Test 3.10**: Speed dropdown shows current rate
- [ ] **Test 3.11**: 0.25x speed works correctly
- [ ] **Test 3.12**: 0.5x speed works correctly
- [ ] **Test 3.13**: 1x (normal) speed works correctly
- [ ] **Test 3.14**: 1.5x speed works correctly
- [ ] **Test 3.15**: 2x speed works correctly
- [ ] **Test 3.16**: Speed changes apply immediately

## 4. Keyboard Shortcuts

### Playback Control
- [ ] **Test 4.1**: Spacebar toggles play/pause
- [ ] **Test 4.2**: 'K' key toggles play/pause
- [ ] **Test 4.3**: 'J' key skips back 1 second
- [ ] **Test 4.4**: 'L' key skips forward 1 second

### Navigation
- [ ] **Test 4.5**: Left arrow moves back 1 second
- [ ] **Test 4.6**: Right arrow moves forward 1 second
- [ ] **Test 4.7**: Shift + Left arrow moves back 5 seconds
- [ ] **Test 4.8**: Shift + Right arrow moves forward 5 seconds
- [ ] **Test 4.9**: Home key goes to timeline start
- [ ] **Test 4.10**: End key goes to timeline end

### Speed Control
- [ ] **Test 4.11**: '1' key sets 0.25x speed
- [ ] **Test 4.12**: '2' key sets 0.5x speed
- [ ] **Test 4.13**: '3' key sets 1x speed
- [ ] **Test 4.14**: '4' key sets 1.5x speed
- [ ] **Test 4.15**: '5' key sets 2x speed

### Editing Shortcuts
- [ ] **Test 4.16**: 'S' key splits clip (when clip selected)
- [ ] **Test 4.17**: Delete key removes clip (when clip selected)
- [ ] **Test 4.18**: Shortcuts don't interfere with text input

## 5. Preview Performance Options

### Quality Toggle
- [ ] **Test 5.1**: Preview quality starts at "high"
- [ ] **Test 5.2**: Click toggle switches to "low"
- [ ] **Test 5.3**: Low quality shows visible difference
- [ ] **Test 5.4**: Quality setting persists during playback
- [ ] **Test 5.5**: Quality toggle works in timeline mode

### Smooth Playback
- [ ] **Test 5.6**: Smooth playback enabled by default
- [ ] **Test 5.7**: Disable smooth playback - notice performance difference
- [ ] **Test 5.8**: Buffer health indicator shows when smooth disabled
- [ ] **Test 5.9**: Buffer health updates during playback
- [ ] **Test 5.10**: Preload behavior changes with smooth setting

## 6. Robust Playback Handling

### Error Recovery
- [ ] **Test 6.1**: Load invalid video file - shows error message
- [ ] **Test 6.2**: Click retry button - attempts reload
- [ ] **Test 6.3**: Network interruption - handles gracefully
- [ ] **Test 6.4**: Corrupted file - shows appropriate error

### Clip Transitions
- [ ] **Test 6.5**: Smooth transition between different formats
- [ ] **Test 6.6**: Smooth transition between different resolutions
- [ ] **Test 6.7**: Handle clips with different frame rates
- [ ] **Test 6.8**: Handle clips with different audio formats

### Performance Under Load
- [ ] **Test 6.9**: Timeline with 20+ clips performs well
- [ ] **Test 6.10**: Rapid seeking doesn't cause lag
- [ ] **Test 6.11**: Multiple format changes don't cause issues
- [ ] **Test 6.12**: Long duration timeline (60+ minutes) works

## 7. Integration Testing

### Timeline Integration
- [ ] **Test 7.1**: Playback works with zoom in/out
- [ ] **Test 7.2**: Playback continues during clip editing
- [ ] **Test 7.3**: Playhead position maintained during timeline changes
- [ ] **Test 7.4**: Playback works with clip reordering

### UI Responsiveness
- [ ] **Test 7.5**: Controls remain responsive during playback
- [ ] **Test 7.6**: Timeline scrolling works during playback
- [ ] **Test 7.7**: Window resize doesn't break playback
- [ ] **Test 7.8**: Multiple browser tabs don't interfere

## 8. Browser Compatibility

### Chrome
- [ ] **Test 8.1**: All features work in Chrome
- [ ] **Test 8.2**: Performance is acceptable
- [ ] **Test 8.3**: No console errors

### Firefox
- [ ] **Test 8.4**: All features work in Firefox
- [ ] **Test 8.5**: Performance is acceptable
- [ ] **Test 8.6**: No console errors

### Edge
- [ ] **Test 8.7**: All features work in Edge
- [ ] **Test 8.8**: Performance is acceptable
- [ ] **Test 8.9**: No console errors

## 9. Accessibility

### Keyboard Navigation
- [ ] **Test 9.1**: All controls accessible via keyboard
- [ ] **Test 9.2**: Tab order is logical
- [ ] **Test 9.3**: Focus indicators are visible

### Screen Reader
- [ ] **Test 9.4**: Controls have appropriate labels
- [ ] **Test 9.5**: Time information is announced
- [ ] **Test 9.6**: State changes are announced

## 10. Performance Benchmarks

### Load Times
- [ ] **Test 10.1**: Timeline with 10 clips loads < 2 seconds
- [ ] **Test 10.2**: Timeline with 50 clips loads < 5 seconds
- [ ] **Test 10.3**: Large video files (>100MB) load reasonably

### Playback Performance
- [ ] **Test 10.4**: 1080p playback is smooth
- [ ] **Test 10.5**: 4K playback works (may be slower)
- [ ] **Test 10.6**: No memory leaks during long sessions

## Test Environment Setup

### Prerequisites
1. Multiple test video files of different formats (MP4, MOV, AVI)
2. Different resolutions (720p, 1080p, 4K)
3. Different durations (short <30s, medium 1-5min, long >10min)
4. Test files with audio and without audio
5. Corrupted/invalid test files for error testing

### Test Data
- Create timeline with 3-5 clips of varying lengths
- Test with single very long clip (>30 minutes)
- Test with many short clips (20+ clips of 5-10 seconds each)
- Mix different video formats in same timeline

## Reporting Issues

When reporting issues, include:
- [ ] Browser and version
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Console errors (if any)
- [ ] Performance impact (if applicable)
- [ ] Test files used (if relevant)

## Sign-off

**Tester Name**: ________________  
**Date**: ________________  
**Overall Status**: ☐ Pass ☐ Pass with Issues ☐ Fail  

**Notes**:
_________________________________
_________________________________
_________________________________