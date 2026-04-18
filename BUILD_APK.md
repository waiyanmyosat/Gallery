# Gallery Build Guide: Native Kotlin (Jetpack Compose)

This project has been migrated to a **Pure Native Kotlin** application using Jetpack Compose, optimized for Android 16 (ARM64).

## 1. Automated Build via GitHub Actions
The project is configured to build automatically on every push to `main`.
1.  **Push to GitHub**: Host this repo on GitHub.
2.  **Download APK**: Go to the "Actions" tab, select a successful run, and download the `gallery-apk` artifact.

## 2. Manual Local Build
To build the project locally, you need the Android SDK and Gradle installed:

```bash
# Build the Debug APK
./gradlew assembleDebug

# The APK will be generated at:
# app/build/outputs/apk/debug/app-debug.apk
```

## Core Tech Stack
- **Language**: Kotlin 2.1
- **UI Framework**: Jetpack Compose (Modern native Android UI)
- **Min SDK**: API 26 (Android 8.0)
- **Target SDK**: API 35 (Android 15+)
- **Architecture**: MVVM with Clean Architecture principles

## Key Features Roadmap (Native)
- [ ] **Photo Grid**: Native high-performance `LazyVerticalGrid`.
- [ ] **Media Store Integration**: Direct access to external storage via Android Content Resolvers.
- [ ] **Native OCR**: Transitioning from Tesseract.js (web) to **ML Kit Text Recognition** (Native).
- [ ] **Vector Search**: Implementation using **ObjectBox** or **SQLite FTS5** with native embeddings.
- [ ] **Material You**: Full support for dynamic color schemes and system-level dark mode.
