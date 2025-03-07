import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { ComposerIntegration } from '../composer/integration';
import { verifyClipboardContent, delay } from '../utils/clipboard';

export class SystemScreenshotMonitor {
  private static instance: SystemScreenshotMonitor;
  private composerIntegration: ComposerIntegration;
  private statusBarItem: vscode.StatusBarItem;
  private lastCheckTime: number = 0;
  private isProcessing: boolean = false;
  
  private constructor(composerIntegration: ComposerIntegration) {
    this.composerIntegration = composerIntegration;
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.text = "$(device-camera) Screenshot Monitor: Active";
    this.statusBarItem.show();
    
    console.log('Screenshot monitor activated'); // Startup log
    
    // Monitor clipboard for screenshots
    setInterval(async () => {
      if (this.isProcessing) return; // Prevent concurrent processing
      
      try {
        this.isProcessing = true;
        
        // Check if there's an image in clipboard
        try {
          await verifyClipboardContent("image");
          const currentTime = Date.now();
          
          // Only process if this is a new clipboard content (within last second)
          if (currentTime - this.lastCheckTime > 800) {
            console.log('New screenshot detected');
            this.lastCheckTime = currentTime;
            
            // Create temp directory if it doesn't exist
            const tmpDir = path.join(__dirname, '..', '..', 'tmp');
            await fs.mkdir(tmpDir, { recursive: true });
            
            // Save current clipboard image to temp file
            const tmpFilePath = path.join(tmpDir, `screenshot-${Date.now()}.png`);
            await new Promise<void>((resolve, reject) => {
              const platform = process.platform;
              let command = '';
              
              switch (platform) {
                case 'darwin':
                  command = `pngpaste "${tmpFilePath}"`;
                  break;
                case 'win32':
                  command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::GetImage().Save('${tmpFilePath}')"`;
                  break;
                case 'linux':
                  command = `xclip -selection clipboard -t image/png -o > "${tmpFilePath}"`;
                  break;
              }
              
              exec(command, (error) => {
                if (error) reject(error);
                else resolve();
              });
            });

            // Read the image file as buffer
            const imageBuffer = await fs.readFile(tmpFilePath);
            
            // Open Composer panel
            await vscode.commands.executeCommand(
              "workbench.panel.composerViewPane2.resetViewContainerLocation"
            );
            
            // Send to Composer using the existing pipeline
            await this.composerIntegration.sendToComposer(
              imageBuffer,
              {
                console: [{
                  timestamp: Date.now(),
                  type: 'screenshot',
                  args: ['Screenshot captured']
                }],
                network: []
              }
            );
            
            // Cleanup temp file
            await fs.unlink(tmpFilePath).catch(console.error);
            
            console.log('Screenshot processed successfully');
            await delay(200); // Small delay to prevent duplicate processing
          }
        } catch (clipboardError) {
          // No image in clipboard, just continue
        }
      } catch (error) {
        console.error('Error processing screenshot:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Check every second
  }

  public static getInstance(composerIntegration: ComposerIntegration): SystemScreenshotMonitor {
    if (!SystemScreenshotMonitor.instance) {
      SystemScreenshotMonitor.instance = new SystemScreenshotMonitor(composerIntegration);
    }
    return SystemScreenshotMonitor.instance;
  }
} 