# TrimBot - Professional Video Editor

TrimBot is a powerful desktop video editing application built with Tauri, React, and FFmpeg. It provides professional video editing capabilities including trimming, screen recording, webcam recording, and export functionality.

## 🚀 Features

### Core Video Editing
- **Video Import**: Support for MP4, AVI, MOV, MKV, and WebM formats
- **Timeline Editing**: Precise trimming with visual timeline interface
- **Video Preview**: Real-time preview with playback controls
- **Export**: High-quality MP4 export with FFmpeg processing

### Recording Capabilities
- **Screen Recording**: Capture your screen with audio using `getDisplayMedia`
- **Webcam Recording**: Record from webcam with live preview and multi-camera support
- **Auto-Processing**: Automatic transcoding from WebM to MP4 format
- **Auto-Import**: Recorded videos automatically added to media library

### User Experience
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Browser Fallback**: Full functionality in web browsers with download fallbacks
- **Toast Notifications**: Comprehensive feedback for all operations
- **Error Recovery**: Robust error handling with helpful guidance
- **Professional UI**: Modern, clean interface built with Tailwind CSS

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for application, additional space for video files
- **CPU**: Intel i3 or AMD equivalent (i5+ recommended for recording)

### Dependencies
- **FFmpeg**: Required for video processing (bundled with desktop app)
- **Modern Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **WebRTC Support**: Required for screen/webcam recording features

## 🛠️ Development Setup

### Prerequisites
```bash
# Install Node.js (v18 or higher)
node --version  # Should be v18+
npm --version   # Should be v8+

# Install Rust (for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version  # Should be 1.70+
```

### Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/trimbot.git
cd trimbot

# Install dependencies
npm install

# Install Tauri CLI (if not already installed)
npm install -g @tauri-apps/cli
```

### Development Commands
```bash
# Start development server (browser mode)
npm run dev

# Start Tauri development (desktop mode)
npm run tauri dev

# Build for production
npm run build

# Build Tauri app (desktop)
npm run tauri build

# Run tests
npm test

# Type checking
npm run check
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Browser version (recommended for development)
npm run dev
# Open http://localhost:3000

# Desktop version
npm run tauri dev
```

### Production Mode
```bash
# Build the application
npm run build
npm run tauri build

# The built application will be in:
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/deb/
```

## 📦 Building and Packaging

### Build Process
1. **Frontend Build**: Vite builds the React application
2. **Tauri Build**: Rust backend is compiled and bundled
3. **FFmpeg Integration**: FFmpeg binaries are included (desktop only)
4. **Platform Package**: Creates platform-specific installers

### Build Commands
```bash
# Clean build
npm run clean
npm run build
npm run tauri build

# Development build (faster, larger file)
npm run tauri build -- --debug

# Release build (optimized, smaller file)
npm run tauri build -- --release
```

### Build Outputs
- **Windows**: `.msi` installer in `src-tauri/target/release/bundle/msi/`
- **macOS**: `.dmg` installer in `src-tauri/target/release/bundle/dmg/`
- **Linux**: `.deb` package in `src-tauri/target/release/bundle/deb/`

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom FFmpeg path (development only)
FFMPEG_PATH=/path/to/ffmpeg

# Optional: Enable debug logging
RUST_LOG=debug
```

### Tauri Configuration
Key configuration files:
- `src-tauri/tauri.conf.json`: Main Tauri configuration
- `src-tauri/Cargo.toml`: Rust dependencies and features
- `vite.config.ts`: Frontend build configuration

## 🐛 Troubleshooting

### Common Issues

#### FFmpeg Not Found
**Problem**: "FFmpeg not found" error
**Solution**: 
- Desktop: FFmpeg should be bundled automatically
- Browser: Install FFmpeg system-wide or use browser-only features
- Development: Ensure FFmpeg is in your PATH

#### Recording Not Working
**Problem**: Screen/webcam recording fails
**Solution**:
- Check browser permissions for camera/microphone
- Ensure HTTPS (required for `getDisplayMedia`)
- Try different browsers (Chrome/Edge recommended)

#### Build Failures
**Problem**: `tauri build` fails
**Solution**:
```bash
# Update dependencies
cargo update
npm update

# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run tauri build
```

#### Performance Issues
**Problem**: Slow video processing
**Solution**:
- Close other applications to free RAM
- Use smaller video files for testing
- Check available disk space
- Ensure FFmpeg is using hardware acceleration

### Debug Mode
```bash
# Enable debug logging
RUST_LOG=debug npm run tauri dev

# Check browser console for frontend errors
# Check terminal output for backend errors
```

### Getting Help
1. Check the [Issues](https://github.com/your-username/trimbot/issues) page
2. Enable debug logging and check console output
3. Verify system requirements are met
4. Try the browser version to isolate desktop-specific issues

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Tauri (Rust), FFmpeg integration
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide icons
- **Notifications**: Sonner toast library

### Project Structure
```
trimbot/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── App.jsx            # Main application component
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source code
│   ├── resources/         # Bundled resources (FFmpeg)
│   ├── icons/             # Application icons
│   └── tauri.conf.json    # Tauri configuration
├── public/                # Static assets
└── dist/                  # Built frontend (generated)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Test on multiple platforms when possible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Desktop application framework
- [FFmpeg](https://ffmpeg.org/) - Video processing engine
- [React](https://reactjs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool and development server

## 📞 Support

For support and questions:
- 📧 Email: support@trimbot.app
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/trimbot/issues)
- 📖 Documentation: [Wiki](https://github.com/your-username/trimbot/wiki)

---

**TrimBot** - Professional video editing made simple. 🎬✨