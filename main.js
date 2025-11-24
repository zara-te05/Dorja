const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Start the backend server
const startBackend = () => {
  const backendDir = path.join(__dirname, 'PROYECT', 'BACK');
  
  // Try running with dotnet
  console.log('Starting backend server...');
  backendProcess = spawn('dotnet', ['run'], {
    cwd: backendDir,
    shell: true,
    stdio: 'inherit'
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
};

// Stop the backend server
const stopBackend = () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'PROYECT', 'FRONT', 'wwwroot', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow local file access
    },
    show: false
  });

  // Start backend first
  startBackend();

  // Wait a bit for backend to start, then load the page
  setTimeout(() => {
    const htmlPath = path.join(__dirname, 'PROYECT', 'FRONT', 'wwwroot', 'home.html');
    mainWindow.loadFile(htmlPath);
    mainWindow.show();
  }, 3000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

