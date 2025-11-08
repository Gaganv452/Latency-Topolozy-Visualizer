# Latency Topology Visualizer

A comprehensive web application for visualizing network latency topology across global servers, tracking market data, and analyzing historical latency trends. Built with Next.js, Three.js, and modern React patterns.

![Latency Topology Visualizer](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-r152-black?style=for-the-badge&logo=three.js)

## 🌟 Features

### 1. **3D Globe Visualization**
- Interactive 3D globe showing server locations worldwide
- Real-time latency visualization with color-coded connections:
  - 🟢 **Green**: Low latency (<50ms)
  - 🟡 **Yellow**: Medium latency (50-100ms)
  - 🔴 **Red**: High latency (>100ms)
- Distinct visual markers for cloud providers:
  - **AWS**: Box shape (orange)
  - **GCP**: Sphere shape (blue)
  - **Azure**: Octahedron/Diamond shape (purple)
  - **Other**: Cylinder shape (gray)
- Interactive legend explaining markers and connection colors
- Smooth camera controls with zoom, pan, and rotation
- Click-to-select servers with detailed information tooltips

### 2. **Market Dashboard**
- **Market Data Tab**: Real-time cryptocurrency market tickers
  - Live price updates every 10 seconds
  - Sortable columns (Symbol, Price, 24h Change, Volume)
  - Search and filter functionality
  - Visual indicators for price changes (trending up/down)
  - Animated price/volume updates
- **Server Latency Tab**: Comprehensive latency table
  - All server pairs with current latency values
  - Color-coded latency indicators
  - Sortable and filterable data
- **Latency Trends Tab**: Historical latency analysis
  - Time-series charts for server pairs
  - Multiple time ranges (1h, 24h, 7d, 30d)
  - Exchange filtering
  - Latency statistics (min, max, average)
  - Interactive tooltips with detailed data points

### 3. **Performance Metrics**
- Real-time system status monitoring
- Server count and connection statistics
- Average latency calculations
- Visual status indicators

### 4. **Controls & Filters**
- Search servers by name or location
- Filter by cloud provider (AWS, GCP, Azure, Other)
- Filter by exchange
- Latency range slider
- Toggle connection visibility
- Export functionality for latency reports

### 5. **Theme Management**
- Dark/Light mode toggle
- Theme persistence in local storage
- Smooth theme transitions

### 6. **Real-time Updates**
- Automatic latency value updates every 7 seconds
- Market data refresh every 10 seconds
- Smooth animations for value changes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher)
- **npm** (v9.0 or higher) or **yarn** (v1.22 or higher)
- **Git** (for cloning the repository)

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Latency-Topology-Visualizer
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### Step 3: Environment Setup

Create a `.env.local` file in the root directory (optional, for custom API endpoints):

```env
# Optional: Custom API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Or using yarn:
```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Step 5: Build for Production

To create an optimized production build:

```bash
npm run build
npm start
```

Or using yarn:
```bash
yarn build
yarn start
```

## 📁 Project Structure

```
Latency-Topology-Visualizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tickers/
│   │   │       └── route.ts          # API proxy for market data
│   │   ├── layout.tsx                # Root layout with metadata
│   │   └── page.tsx                  # Main application page
│   ├── components/
│   │   ├── map-container.tsx          # 3D globe visualization
│   │   ├── MarketDashboard.tsx       # Market dashboard with tabs
│   │   ├── liveMarketData.tsx        # Market data table
│   │   ├── LatencyTable.tsx          # Server latency table
│   │   ├── HistoricalLatencyTrends.tsx # Historical trends chart
│   │   ├── control-panel.tsx         # Filters and controls
│   │   ├── header.tsx                # Application header
│   │   ├── PerformanceMetrics.tsx    # Performance dashboard
│   │   └── ThemeToggle.tsx           # Theme switcher
│   ├── lib/
│   │   ├── historical-data.ts        # Historical data utilities
│   │   ├── latency-updater.ts        # Real-time latency updates
│   │   └── export-utils.ts           # Data export utilities
│   └── types/
│       └── geo.ts                     # TypeScript type definitions
├── public/                            # Static assets
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── next.config.js                     # Next.js configuration
└── README.md                          # This file
```

## 🛠️ Technologies Used

### Core Framework
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript

### 3D Visualization
- **Three.js**: 3D graphics library
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for React Three Fiber

### Data Visualization
- **Recharts**: Chart library for historical trends
- **Lucide React**: Icon library

### UI Components
- **ShadCN UI**: Reusable component library
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

### Data Fetching
- **Next.js API Routes**: Server-side API proxy
- **Fetch API**: HTTP requests

## 📡 API Endpoints

### Internal API Routes

#### `GET /api/tickers`
Proxies requests to the Blockchain.com API to fetch market ticker data.

**Response:**
```json
[
  {
    "symbol": "BTC-USD",
    "last_trade_price": 45000.00,
    "price_24h": 44000.00,
    "volume_24h": 1234567.89
  }
]
```

**Features:**
- CORS bypass for external API
- Aggressive cache-busting
- Error handling and timeout management
- Request logging

## 🎮 Usage Guide

### Navigating the 3D Globe

1. **Rotate**: Click and drag to rotate the globe
2. **Zoom**: Scroll to zoom in/out
3. **Pan**: Right-click and drag to pan
4. **Select Server**: Click on a server marker to view details
5. **View Connections**: Connections between servers are automatically displayed

### Using the Market Dashboard

1. **Switch Tabs**: Click on "Market Data", "Server Latency", or "Latency Trends"
2. **Search**: Use the search bar to filter by symbol or server name
3. **Sort**: Click column headers to sort data
4. **Filter**: Use dropdowns to filter by exchange or cloud provider
5. **View Trends**: Select a server pair and time range to view historical data

### Controls & Filters

1. **Search Servers**: Type in the search box to filter servers
2. **Cloud Provider Filter**: Select one or more providers
3. **Exchange Filter**: Filter by exchange name
4. **Latency Range**: Adjust the slider to filter by latency range
5. **Toggle Connections**: Show/hide connection lines
6. **Export Data**: Click the export button to download latency reports

### Theme Toggle

- Click the theme toggle button in the header to switch between dark and light modes
- Your preference is saved in local storage

## 🔧 Configuration

### Customizing Server Data

Edit `src/app/page.tsx` to modify the initial server locations and data:

```typescript
const servers: ServerLocation[] = [
  {
    id: "server-1",
    name: "New York",
    lat: 40.7128,
    lng: -74.0060,
    cloudProvider: "AWS",
    exchange: "NYSE",
    // ... other properties
  },
];
```

### Adjusting Update Intervals

Modify the update intervals in `src/app/page.tsx`:

```typescript
// Latency updates (default: 7 seconds)
useEffect(() => {
  const interval = setInterval(() => {
    updateLatencyValues(servers);
  }, 7000);
  return () => clearInterval(interval);
}, []);

// Market data updates (default: 10 seconds)
// Edit in src/components/liveMarketData.tsx
```

### Customizing Latency Thresholds

Edit the `getLatencyColor` function in `src/components/map-container.tsx`:

```typescript
function getLatencyColor(latency: number) {
  if (latency < 50) return new THREE.Color("#00FF00"); // Green
  if (latency < 100) return new THREE.Color("#FFFF00"); // Yellow
  return new THREE.Color("#FF0000"); // Red
}
```

## 🐛 Troubleshooting

### Issue: CORS Errors in Browser Console

**Solution**: The application uses Next.js API routes to proxy external API requests. Ensure the API route at `src/app/api/tickers/route.ts` is properly configured.

### Issue: Market Data Not Updating

**Possible Causes:**
1. The external API may update infrequently
2. Browser caching may be interfering

**Solutions:**
- Check browser console for errors
- Verify the API route is working: `http://localhost:3000/api/tickers`
- Clear browser cache or use incognito mode
- Check network tab in browser DevTools

### Issue: 3D Globe Not Rendering

**Solutions:**
1. Ensure WebGL is enabled in your browser
2. Check browser console for Three.js errors
3. Verify all dependencies are installed: `npm install`
4. Try a different browser (Chrome, Firefox, Edge)

### Issue: Build Errors

**Solutions:**
1. Clear `.next` folder: `rm -rf .next` (Linux/Mac) or `rmdir /s .next` (Windows)
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run type-check` (if available)

### Issue: Port Already in Use

**Solution**: Use a different port:
```bash
npm run dev -- -p 3001
```

## 📊 Performance Considerations

- **3D Rendering**: The globe uses optimized Three.js rendering with instanced geometries
- **Data Updates**: Real-time updates are debounced to prevent excessive re-renders
- **Memory Management**: Old Three.js objects are properly disposed to prevent memory leaks
- **API Caching**: Aggressive cache-busting ensures fresh data, but may increase API calls

## 🔒 Security Notes

- The application proxies external API requests through Next.js API routes to bypass CORS
- No sensitive data is stored in local storage (only theme preference)
- API keys should be stored in environment variables (not committed to git)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Three.js** community for excellent 3D graphics library
- **Next.js** team for the amazing framework
- **ShadCN** for beautiful UI components
- **Blockchain.com** for providing market data API

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ using Next.js, Three.js, and React**

