# Screenshot Flow Process

## Overview
This document details the exact flow of how screenshots are captured and sent to the Composer chat window.

## Detailed Steps

1. **User Trigger**
   - User hits keyboard shortcut (e.g., `cmd+shift+'` for screenshot only)
   - This activates the `web-preview.sendScreenshot` command

2. **Capture Process** (`handleSendScreenshot()`)
   - Checks if browser is connected
   - Shows progress notification "Capturing Screenshot"
   - Uses Puppeteer to capture the page:
   ```typescript
   const screenshot = await page.screenshot({
     type: "png",
     fullPage: true,
     encoding: "binary",
   });
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
1. Trigger (keyboard shortcut)
2. Capture (via Puppeteer)
3. Temporary storage (as file)
4. Clipboard operation (copy)
5. VSCode command (paste into Composer)
6. Cleanup (delete temp file)

## Note
The process uses the system clipboard as an intermediary step to transfer the image into Composer, rather than sending it directly. 