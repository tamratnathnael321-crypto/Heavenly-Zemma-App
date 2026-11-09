import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Smartphone, Apple, GitBranch } from 'lucide-react';

interface BuildInstructionsModalProps {
  onClose: () => void;
}

export const BuildInstructionsModal: React.FC<BuildInstructionsModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const androidCommands = `# 1. Build the production web bundle
npm run build

# 2. Add Android native platform (first time only)
npx cap add android

# 3. Synchronize plugins and bundle to Android
npx cap sync android

# 4. Open in Android Studio to run or debug
npx cap open android

# 5. OR build debug/release APK directly from CLI
cd android
./gradlew assembleRelease
# Output APK generated at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk`;

  const iosCommands = `# 1. Build the production web bundle
npm run build

# 2. Add iOS native platform (macOS only, first time)
npx cap add ios

# 3. Synchronize plugins and bundle to iOS
npx cap sync ios

# 4. Open in Xcode to run on simulator or archive for App Store
npx cap open ios

# 5. OR build directly from terminal (with xcodebuild)
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -destination generic/platform=iOS archive -archivePath build/App.xcarchive`;

  const otaCommands = `# Capgo Live Updates (Instant OTA without App Store review)
# 1. Login to Capgo CLI
npx @capgo/cli init [API_KEY]

# 2. Build and upload new OTA bundle instantly
npm run build
npx @capgo/cli bundle upload -a ba25f71a-856a-43c1-8b1f-0b89ee8b1e4a -c production`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#141414] border border-[#282828] rounded-2xl flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <Smartphone size={20} className="text-[#1ed760]" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Build Android APK & iOS Project
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white hover:bg-[#282828]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm no-scrollbar">
          {/* Android Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1ed760]" />
                Android APK & AAB (CLI Commands)
              </span>
              <button
                onClick={() => copyToClipboard(androidCommands, 'android')}
                className="flex items-center gap-1.5 text-xs text-[#1ed760] hover:underline"
              >
                {copiedSection === 'android' ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-black rounded-xl border border-[#242424] text-[12px] font-mono text-[#d1d5db] overflow-x-auto whitespace-pre leading-relaxed">
              {androidCommands}
            </pre>
          </div>

          {/* iOS Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Apple size={16} className="text-[#a7a7a7]" />
                iOS Xcode Project & Archive (macOS)
              </span>
              <button
                onClick={() => copyToClipboard(iosCommands, 'ios')}
                className="flex items-center gap-1.5 text-xs text-[#1ed760] hover:underline"
              >
                {copiedSection === 'ios' ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-black rounded-xl border border-[#242424] text-[12px] font-mono text-[#d1d5db] overflow-x-auto whitespace-pre leading-relaxed">
              {iosCommands}
            </pre>
          </div>

          {/* Capgo OTA Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <GitBranch size={16} className="text-[#1ed760]" />
                Over-The-Air (OTA) Live Update CLI
              </span>
              <button
                onClick={() => copyToClipboard(otaCommands, 'ota')}
                className="flex items-center gap-1.5 text-xs text-[#1ed760] hover:underline"
              >
                {copiedSection === 'ota' ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-black rounded-xl border border-[#242424] text-[12px] font-mono text-[#d1d5db] overflow-x-auto whitespace-pre leading-relaxed">
              {otaCommands}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#242424] bg-[#181818] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#1ed760] text-black font-semibold text-xs hover:bg-[#1fdf64] transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
