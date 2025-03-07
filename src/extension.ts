import * as vscode from "vscode";
import { ComposerIntegration } from "./composer/integration";
import { BrowserMonitor } from "./browser/monitor";
import { CommandHandlers } from "./commands";
import { ToastService } from "./utils/toast";
import { SystemScreenshotMonitor } from "./screenshot/systemMonitor";

export function activate(context: vscode.ExtensionContext) {
  const composerIntegration = ComposerIntegration.getInstance(context);
  const browserMonitor = BrowserMonitor.getInstance();
  const commandHandlers = new CommandHandlers(
    browserMonitor,
    composerIntegration
  );
  const toastService = ToastService.getInstance();
  SystemScreenshotMonitor.getInstance(composerIntegration);

  context.subscriptions.push(
    vscode.commands.registerCommand("web-preview.smartCapture", () =>
      commandHandlers.handleSmartCapture()
    ),
    vscode.commands.registerCommand("web-preview.clearLogs", () =>
      commandHandlers.handleClearLogs()
    ),
    vscode.commands.registerCommand("web-preview.sendLogs", () =>
      commandHandlers.handleSendLogs()
    ),
    vscode.commands.registerCommand("web-preview.sendScreenshot", () =>
      commandHandlers.handleSendScreenshot()
    ),
    browserMonitor
  );

  browserMonitor.onDisconnect(() => {
    toastService.showBrowserDisconnected();
  });
}

export function deactivate() {}
