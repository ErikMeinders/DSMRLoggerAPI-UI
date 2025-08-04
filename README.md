# DSMR Logger UI - Alternative Dashboards

A collection of alternative web dashboards for the [DSMRloggerAPI](https://github.com/mrWheel/DSMRloggerAPI) project. These dashboards run directly on your DSMR Logger device, eliminating CORS issues and providing real-time energy monitoring.

## 📋 Requirements

This project requires DSMR Logger hardware and firmware as described in the [DSMRloggerWS documentation](https://mrwheel.github.io/DSMRloggerWS/introductie/).

**Supported Hardware:**
- ESP32 or ESP8266 development board
- DSMR P1 cable connection
- Compatible smart meter with P1 port

**Required Firmware:**
- [DSMRloggerAPI](https://github.com/mrWheel/DSMRloggerAPI) firmware
- API v2 support for optimal functionality

## 🎯 Available Dashboards

### 1. Main Energy Dashboard (`dashboard.html`)
- **Size**: ~80KB standalone file
- **Features**: Comprehensive energy monitoring with charts and gauges
- **Data**: Power consumption/generation, daily totals, cost estimates
- **Layout**: Responsive grid layout for all devices

### 2. 3-Phase Power Monitor (`3phase.html`)
- **Size**: ~32KB standalone file  
- **Features**: Real-time 3-phase power monitoring with analog gauges
- **Data**: Individual phase loads, voltage, current, total consumption
- **Layout**: 4-card layout (Phase 1, 2, 3, and Total)

## 🚀 Quick Deployment

### Using Make (Recommended)
```bash
# Deploy main dashboard
make deploy

# Deploy 3-phase monitor
make deploy FILE=3phase.html

# Deploy to custom host
make deploy HOST=192.168.1.100 FILE=dashboard.html
```

### Manual File Upload
1. Access your DSMR Logger file manager: `http://your-dsmr-logger.local/FSmanager.html`
2. Upload the desired `.html` file
3. Access via: `http://your-dsmr-logger.local/filename.html`

### Using Upload Tool Directly
```bash
# Install dependencies
npm install

# Upload any file
node fm-upload.js dashboard.html dsmr-logger.local:
node fm-upload.js 3phase.html 192.168.1.100:
```

## 🔧 Configuration

### Default Settings
- **Host**: `dsmr-mw9.local` (configurable)
- **API**: Uses DSMR Logger API v2 endpoints
- **Updates**: Real-time data every 2-5 seconds
- **CORS**: No issues (same-origin serving)

### Energy Prices (Main Dashboard)
Edit price constants in `dashboard.html`:
```javascript
electricity_low: 0.23,   // €/kWh (tariff 1)
electricity_high: 0.25,  // €/kWh (tariff 2)  
gas: 0.85               // €/m³
```

## 📊 Features

### Main Dashboard
- ✅ Real-time power consumption/generation
- ✅ Energy totals (electricity + gas)
- ✅ Cost calculations
- ✅ Historical charts
- ✅ Mobile responsive design

### 3-Phase Monitor
- ✅ Individual phase monitoring (L1, L2, L3)
- ✅ Analog gauge displays (-25A to +25A)
- ✅ Net consumption vs production indication
- ✅ Total power calculation
- ✅ Color-coded status headers

## 🛠️ Development

### Project Structure
```
├── dashboard.html      # Main energy dashboard
├── 3phase.html         # 3-phase power monitor  
├── fm-upload.js        # File upload utility
├── Makefile           # Build & deployment automation
├── package.json       # Node.js dependencies
└── README.md          # This documentation
```

### Make Targets
```bash
make help              # Show all available commands
make deploy            # Deploy default dashboard
make status            # Show project status
make clean             # Clean dependencies
make fm-upload         # Upload custom files
```

### API Endpoints Used
- `/api/v2/sm/fields/power_delivered_l1` - Phase 1 delivered power
- `/api/v2/sm/fields/power_returned_l1` - Phase 1 returned power
- `/api/v2/sm/actual` - Real-time smart meter data
- Additional endpoints for comprehensive monitoring

## 🌐 Browser Support

- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)  
- ✅ Safari (macOS & iOS)
- ✅ Edge (Windows)
- ✅ Mobile responsive (320px+)

## 🔍 Troubleshooting

### Dashboard Not Loading
1. Verify file upload in File Manager: `http://your-host/FSmanager.html`
2. Check DSMR Logger API: `http://your-host/api/v2/`
3. Ensure firmware supports API v2

### No Data Displaying
- Connection status indicator shows real-time connection state
- Check browser console (F12) for errors
- Verify DSMR P1 cable connection and meter compatibility

## 🔗 Related Projects

- **Main Project**: [DSMRloggerAPI](https://github.com/mrWheel/DSMRloggerAPI)
- **Documentation**: [DSMRloggerWS](https://mrwheel.github.io/DSMRloggerWS/introductie/)
- **Hardware Setup**: [Introduction Guide](https://mrwheel.github.io/DSMRloggerWS/introductie/)

## 📱 Access Your Dashboards

Once deployed, access your dashboards at:
- **Main Dashboard**: `http://your-dsmr-logger.local/dashboard.html`
- **3-Phase Monitor**: `http://your-dsmr-logger.local/3phase.html`

Replace `your-dsmr-logger.local` with your actual DSMR Logger hostname or IP address.
