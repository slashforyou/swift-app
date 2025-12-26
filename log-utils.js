const fs = require('fs');
const path = require('path');

/**
 * Log Export Utility
 * This script helps export logs from the application for analysis
 */

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to save logs to a file
function saveLogsToFile(logs, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = filename || `exported-logs-${timestamp}.log`;
  const logFilePath = path.join(logsDir, logFileName);
  
  try {
    fs.writeFileSync(logFilePath, logs, 'utf8');
    console.log(`✅ Logs saved to: ${logFilePath}`);
    return logFilePath;
  } catch (error) {
    console.error('❌ Failed to save logs:', error);
    return null;
  }
}

// Function to read the latest log file
function readLatestLogFile() {
  try {
    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(logsDir, file),
        stats: fs.statSync(path.join(logsDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    if (files.length === 0) {
      console.log('No log files found');
      return null;
    }
    
    const latestFile = files[0];
    const content = fs.readFileSync(latestFile.path, 'utf8');
    console.log(`📖 Reading latest log file: ${latestFile.name}`);
    return content;
  } catch (error) {
    console.error('❌ Failed to read log file:', error);
    return null;
  }
}

// Function to list all log files
function listLogFiles() {
  try {
    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: (stats.size / 1024).toFixed(2) + ' KB',
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    console.log('📁 Available log files:');
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.size}) - ${file.modified}`);
    });
    
    return files;
  } catch (error) {
    console.error('❌ Failed to list log files:', error);
    return [];
  }
}

// Command line interface
const command = process.argv[2];
const argument = process.argv[3];

switch (command) {
  case 'save':
    if (argument) {
      saveLogsToFile(argument, process.argv[4]);
    } else {
      console.log('Usage: node log-utils.js save "<log content>" [filename]');
    }
    break;
  
  case 'read':
    readLatestLogFile();
    break;
  
  case 'list':
    listLogFiles();
    break;
  
  default:
    console.log(`
📝 Log Utility Commands:

  save "<content>" [filename]  - Save log content to file
  read                         - Read the latest log file
  list                         - List all log files

Examples:
  node log-utils.js save "console logs here" my-logs.log
  node log-utils.js read
  node log-utils.js list
    `);
}

module.exports = {
  saveLogsToFile,
  readLatestLogFile,
  listLogFiles,
  logsDir
};