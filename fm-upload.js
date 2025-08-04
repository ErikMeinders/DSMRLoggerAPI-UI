#!/usr/bin/env node

/**
 * FileManager Upload Tool
 * Generic file upload utility for ESP32 File Manager with SCP-like syntax
 * Usage: fm-upload <localfile> <host>:[remote-filename]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration defaults
const DEFAULT_CONFIG = {
    TIMEOUT: 30000, // 30 seconds
    UPLOAD_ENDPOINT: '/upload?f=/', // FSManager expects folder parameter
    PORT: 80
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logInfo(message) { log('blue', `INFO: ${message}`); }
function logSuccess(message) { log('green', `SUCCESS: ${message}`); }
function logWarning(message) { log('yellow', `WARNING: ${message}`); }
function logError(message) { log('red', `ERROR: ${message}`); }

// Parse SCP-like arguments: fm-upload <localfile> <host>:[remote-filename]
function parseArguments() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        showHelp();
        process.exit(0);
    }
    
    if (args.length < 2) {
        logError('Missing required arguments');
        showHelp();
        process.exit(1);
    }
    
    const localFile = args[0];
    const hostSpec = args[1];
    
    // Parse host:[remote-filename] format
    const hostParts = hostSpec.split(':');
    if (hostParts.length < 1 || hostParts.length > 2) {
        logError('Invalid host specification. Use format: host:[remote-filename]');
        process.exit(1);
    }
    
    const host = hostParts[0];
    const remoteFilename = hostParts[1] || path.basename(localFile);
    
    if (!host) {
        logError('Host cannot be empty');
        process.exit(1);
    }
    
    return {
        localFile,
        host,
        remoteFilename,
        timeout: DEFAULT_CONFIG.TIMEOUT
    };
}

// Check if local file exists
function checkLocalFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            reject(new Error(`Local file '${filePath}' not found`));
            return;
        }
        
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            reject(new Error(`'${filePath}' is not a file`));
            return;
        }
        
        logSuccess(`Local file found: ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`);
        resolve(stats);
    });
}

// Test connectivity to host
function testConnectivity(host, timeout) {
    return new Promise((resolve, reject) => {
        logInfo(`Testing connectivity to ${host}...`);
        
        const req = http.get(`http://${host}/FSmanager.html`, {
            timeout: timeout
        }, (res) => {
            if (res.statusCode === 200) {
                logSuccess(`Successfully connected to ${host}`);
                resolve(true);
            } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Connection timeout'));
        });
        
        req.on('error', (err) => {
            reject(new Error(`Connection failed: ${err.message}`));
        });
    });
}

// Upload file via form data
function uploadFile(localFile, host, remoteFilename, timeout) {
    return new Promise((resolve, reject) => {
        logInfo(`Uploading ${localFile} as ${remoteFilename}...`);
        
        const fileContent = fs.readFileSync(localFile);
        const boundary = '----formdata-fm-upload-' + Math.random().toString(16);
        
        // Detect content type based on file extension
        const ext = path.extname(localFile).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes = {
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.xml': 'application/xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        if (mimeTypes[ext]) {
            contentType = mimeTypes[ext];
        }
        
        // Construct multipart form data
        const formData = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="up[]"; filename="${remoteFilename}"\r\n`),
            Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);
        
        // Prepare upload request
        const options = {
            hostname: host,
            port: DEFAULT_CONFIG.PORT,
            path: DEFAULT_CONFIG.UPLOAD_ENDPOINT,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formData.length,
                'Connection': 'close'
            },
            timeout: timeout
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    logSuccess(`File uploaded successfully: ${remoteFilename}`);
                    resolve({ statusCode: res.statusCode, data });
                } else {
                    reject(new Error(`Upload failed: HTTP ${res.statusCode}\nResponse: ${data}`));
                }
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Upload timeout'));
        });
        
        req.on('error', (err) => {
            reject(new Error(`Upload failed: ${err.message}`));
        });
        
        // Send the form data
        req.write(formData);
        req.end();
    });
}

// Verify uploaded file is accessible
function verifyUpload(host, remoteFilename, timeout) {
    return new Promise((resolve, reject) => {
        logInfo(`Verifying upload: http://${host}/${remoteFilename}`);
        
        const req = http.get(`http://${host}/${remoteFilename}`, {
            timeout: timeout
        }, (res) => {
            if (res.statusCode === 200) {
                logSuccess(`File is accessible at: http://${host}/${remoteFilename}`);
                resolve(true);
            } else if (res.statusCode === 404) {
                logWarning(`File uploaded but not accessible at root. May be in a subdirectory.`);
                resolve(false);
            } else {
                logWarning(`File verification returned HTTP ${res.statusCode}`);
                resolve(false);
            }
        });
        
        req.on('timeout', () => {
            req.destroy();
            logWarning('Verification timeout - file may still be uploaded');
            resolve(false);
        });
        
        req.on('error', (err) => {
            logWarning(`Verification failed: ${err.message} - file may still be uploaded`);
            resolve(false);
        });
    });
}

// Main upload function
async function main() {
    try {
        const config = parseArguments();
        
        console.log(`fm-upload: ${config.localFile} -> ${config.host}:${config.remoteFilename}`);
        
        // Step 1: Check local file
        await checkLocalFile(config.localFile);
        
        // Step 2: Test connectivity
        await testConnectivity(config.host, config.timeout);
        
        // Step 3: Upload file
        await uploadFile(config.localFile, config.host, config.remoteFilename, config.timeout);
        
        // Step 4: Verify upload (optional)
        await verifyUpload(config.host, config.remoteFilename, config.timeout);
        
        logSuccess(`Upload completed: ${config.localFile} -> http://${config.host}/${config.remoteFilename}`);
        
    } catch (error) {
        logError(error.message);
        
        // Try to get config for manual instructions, but handle errors gracefully
        try {
            const config = parseArguments();
            console.log('\nManual upload instructions:');
            console.log(`1. Open: http://${config.host}/FSmanager.html`);
            console.log(`2. Click "Choose Files" and select: ${config.localFile}`);
            console.log(`3. Click "Upload"`);
        } catch (parseError) {
            console.log('\nManual upload instructions:');
            console.log('1. Open: http://[your-host]/FSmanager.html');
            console.log('2. Click "Choose Files" and select your file');
            console.log('3. Click "Upload"');
        }
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
FileManager Upload Tool

Upload files to ESP32 FileManager with SCP-like syntax.

Usage:
  fm-upload <localfile> <host>:[remote-filename]

Arguments:
  localfile           Path to local file to upload
  host                Target hostname or IP address
  remote-filename     Remote filename (optional, defaults to local filename)

Examples:
  fm-upload dashboard.html dsmr-mw9.local:
  fm-upload dashboard.html 192.168.1.100:
  fm-upload style.css dsmr-mw9.local:custom.css
  fm-upload app.js 192.168.1.100:application.js

Options:
  -h, --help          Show this help message

Note: Remote filename is optional. If omitted, uses the local filename.
The colon (:) is required even when remote filename is omitted.
`);
}

// Run the main function
if (require.main === module) {
    main();
}

module.exports = { main, parseArguments, checkLocalFile, testConnectivity, uploadFile, verifyUpload };
