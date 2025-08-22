# 🔒 Whistle - Anonymous Harassment Reporting System

A secure, anonymous reporting platform built for hackathons, workspaces, and events. Whistle enables users to report harassment safely while providing administrators with real-time alerts and management tools.

## 🏆 Award-Winning Features

- **🔐 Client Side Encryption** -  Encrypted data handled in local storage
- **📱 QR Code Access** - Zero-friction reporting via QR codes
- **⚡ Real-time Alerts** - Instant admin notifications
- **⚡Email Alerts** - Instant email notifications
- **🛡️ 100% Anonymous** - No personal data collection
- **🎯 Smart Categorization** - AI-powered severity detection
- **📊 Admin Dashboard** - Professional report management
- **Maps / Geo-tagging**- Leaflet.js + OpenStreetMap for interactive maps


## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```


   - **Start Command:** `npm start`
   - **Instance Type:** Free (or upgrade for production)


### Security Features

- Anonymous session management
- Encrypted data storage
- No IP or device tracking
  
## 📱 Usage

### For Users:

1. **Scan QR Code** or visit `/report`
2. **Select Category** (Harassment, Medical, Emergency, etc.)
3. **Write Report** with optional photo evidence
4. **Submit Anonymously** and receive tracking ID
5. **Check Status** anytime with tracking ID

### For Admins:

1. **Login** at `/admin` with credentials
2. **View Reports** in real-time dashboard
3. **Manage Status** (Pending → Reviewed → Resolved)
4. **Respond** to reports with admin comments
5. **Generate QR Codes** for events

## 🔔 Notification System

### Real-time Alerts:

- **In-app notifications** for new reports
- **Browser push notifications**
- **Email alerts** for urgent reports
- **Sound alerts** with severity-based tones

### Alert Prioritization:

- 🟢 **Standard Reports** → In-app + browser notification
- 🟡 **High Priority** → In-app + browser notification
- 🔴 **Urgent/Emergency** → Above + email alert

## 🛡️ Security Architecture

### Client-Side:

- **Anonymous sessions** with no tracking
- **Secure form validation**
- **Photo metadata removal**

### Server-Side:

- **Encrypted local storage**
- **Admin authentication required**
- **Audit trail logging**
- **Rate limiting protection**

## 🎯 Use Cases

- **Hackathons & Tech Events**
- **Corporate Workspaces**
- **Educational Institutions**
- **Conference & Conventions**
- **Community Organizations**

## 📊 Technical Stack

- **Frontend:** React 18 + TypeScript + TailwindCSS
- **Backend:** Express.js + Node.js
- **Encryption:** crypto-js (AES-256)
- **Notifications:** Server-Sent Events (SSE)
- **UI Components:** Radix UI + Lucide Icons
- **Build:** Vite + SWC

## 🌍 Production Considerations


### Email Service:

```bash
npm install @sendgrid/mail
# Configure in server/routes/notifications.ts
```


## 🏆 Hackathon Ready

**Whistle** is built to win with:

- **Innovation:** Client side encryption + QR access + AI categorization
- **Impact:** Real-world harassment prevention
- **Technical Excellence:** Production-ready architecture
- **User Experience:** Zero-friction anonymous reporting
- **Scalability:** Enterprise-ready from day one

## 📄 License

MIT License - Perfect for hackathons and production use.

**Built with ❤️ for safer communities**

_Whistle: Speak up safely. Stay anonymous. Save lives._
