#!/usr/bin/env bash
# setup-gradle-init.sh
#
# Creates the Gradle init script required to build the Android app locally.
#
# WHY THIS IS NEEDED:
#   expo-modules-core@57.0.13 ships expo-module-gradle-plugin compiled with
#   Kotlin 2.1.20. @react-native/gradle-plugin@0.86.2 ships pre-built .kotlin_module
#   metadata files compiled with Kotlin 2.3.0. When expo-module-gradle-plugin tries
#   to link against the RN plugin classes, Kotlin's metadata version check fails.
#
#   The fix: add -Xskip-metadata-version-check to all Kotlin compile tasks globally.
#   This script writes the init script to ~/.gradle/init.d/ which Gradle loads
#   automatically for every build on this machine.
#
# USAGE:
#   bash apps/mobile/android/scripts/setup-gradle-init.sh

set -e

INIT_DIR="$HOME/.gradle/init.d"
INIT_FILE="$INIT_DIR/kotlin-suppress-metadata.gradle"

mkdir -p "$INIT_DIR"

cat > "$INIT_FILE" << 'INITSCRIPT'
// Suppress Kotlin metadata version incompatibility between:
//   expo-module-gradle-plugin  (Kotlin 2.1.20)
//   react-native-gradle-plugin (Kotlin 2.3.0 — shipped pre-built in @react-native/gradle-plugin@0.86.2)
//
// This is a known upstream issue in Expo SDK 57 + React Native 0.86.x.
// See: apps/mobile/android/scripts/setup-gradle-init.sh for full explanation.
gradle.allprojects {
    afterEvaluate { project ->
        project.tasks.matching { it.class.name.contains("KotlinCompile") }.each { task ->
            try {
                def opts = task.kotlinOptions
                def existing = opts.freeCompilerArgs ?: []
                if (!existing.contains("-Xskip-metadata-version-check")) {
                    opts.freeCompilerArgs = existing + ["-Xskip-metadata-version-check"]
                }
            } catch (ignored) {}
        }
    }
}
INITSCRIPT

echo "✓ Gradle init script written to: $INIT_FILE"
echo "  Android builds should now work. Run: cd apps/mobile && npx expo run:android"
