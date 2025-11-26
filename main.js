const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Start the backend server
const startBackend = () => {
  const backendDir = path.join(__dirname, 'PROYECT', 'BACK');
  
  console.log('Starting backend server...');
  console.log('Backend directory:', backendDir);
  
  // Check if directory exists
  if (!fs.existsSync(backendDir)) {
    console.error('ERROR: Backend directory not found:', backendDir);
    return;
  }

  // Try running with dotnet
  backendProcess = spawn('dotnet', ['run', '--urls', 'http://localhost:5222'], {
    cwd: backendDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'] // Capture output
  });

  let backendReady = false;

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Backend: ${output}`);
    
    // Check if backend is ready
    if (output.includes('Now listening on:') || output.includes('Application started')) {
      backendReady = true;
      console.log('✅ Backend server is ready!');
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`Backend Error: ${error}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendReady = false;
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
    console.error('Make sure .NET SDK is installed and available in PATH');
  });

  return backendProcess;
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
  const backendProc = startBackend();

  // Wait for backend to be ready, then load the page
  const checkBackend = setInterval(() => {
    // Try to connect to the backend
    const http = require('http');
    const req = http.get('http://localhost:5222/api/Users', (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // Backend is responding
        clearInterval(checkBackend);
        console.log('✅ Backend is ready, loading frontend...');
        const htmlPath = path.join(__dirname, 'PROYECT', 'FRONT', 'wwwroot', 'home.html');
        mainWindow.loadFile(htmlPath);
        mainWindow.show();
      }
    });
    
    req.on('error', () => {
      // Backend not ready yet, keep waiting
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
    });
  }, 1000);

  // Timeout after 30 seconds
  setTimeout(() => {
    clearInterval(checkBackend);
    if (!mainWindow.isVisible()) {
      console.error('⚠️ Backend did not start in time. Loading frontend anyway...');
      const htmlPath = path.join(__dirname, 'PROYECT', 'FRONT', 'wwwroot', 'home.html');
      mainWindow.loadFile(htmlPath);
      mainWindow.show();
    }
  }, 30000);

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

