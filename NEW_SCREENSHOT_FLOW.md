# New Screenshot Flow Process

## Overview
This document details the exact flow of how system screenshots are captured from clipboard and sent to the Composer chat window.

## Detailed Steps

1. **User Trigger**
   - User hits macOS screenshot shortcut (`cmd+shift+ctrl+4`)
   - User selects area to capture on screen
   - Screenshot is saved to clipboard

2. **Capture Process** (`SystemScreenshotMonitor`)
   - Detects new clipboard content
   - If clipboard contains image, gets it as Buffer:
   ```typescript
   const image = await vscode.env.clipboard.readImage();
   const screenshot = image.toBuffer();
   ```

3. **Composer Preparation** (`sendToComposer()`)
   - Opens the Composer panel via VSCode command:
   ```typescript
   await vscode.commands.executeCommand(
     "workbench.panel.composerViewPane2.resetViewContainerLocation"
   );
   ```

4. **Image Processing** (`sendImageToComposer()`)
   - Creates a temporary file in extension's storage:
   ```typescript
   const tmpFilePath = path.join(tmpDir, `${extensionId}-preview-${Date.now()}.png`);
   await fs.writeFile(tmpFilePath, screenshot);
   ```
   - Copies image to system clipboard using platform-specific commands
   - Executes VSCode's paste command to paste into Composer:
   ```typescript
   await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
   ```
   - Cleans up by deleting the temporary file

5. **Completion**
   - Shows success notification
   - Image appears in Composer chat window

## Summary Flow
1. Trigger (macOS screenshot to clipboard: `cmd+shift+ctrl+4`)
2. Capture (monitor clipboard for new image)
3. Temporary storage (as file)
4. Clipboard operation (copy)
5. VSCode command (paste into Composer)
6. Cleanup (delete temp file)

## Note
The process uses the system clipboard as an intermediary step to transfer the image into Composer, rather than sending it directly.






systemMonitor.ts

// Simple polling to check for clipboard changes
setInterval(async () => {
  try {
    const currentContent = await vscode.env.clipboard.readText();
    if (currentContent !== this.lastClipboardContent) {
      console.log('Clipboard change detected'); // Debug log
      this.lastClipboardContent = currentContent;
      
      // Basic check if content might be image data
      if (currentContent.startsWith('data:image') || currentContent.includes('PNG') || currentContent.includes('JPEG')) {
        console.log('Potential image content detected'); // Debug log
        try {
          await this.composerIntegration.sendToComposer(Buffer.from(currentContent), undefined);
          console.log('Content sent to Composer'); // Debug log
        } catch (error) {
          console.log('Error sending to Composer:', error); // Debug log
        }
      }
    }
  } catch (error) {
    console.log('Error checking clipboard:', error); // Debug log
  }
}, 1000); // Check every second