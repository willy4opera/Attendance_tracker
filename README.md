<div align="center">

# 📊 Attendance Tracker

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

<p align="center">
  <strong>A modern, real-time attendance tracking system with QR code support</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## ✨ Features

<table>
<tr>
<td>

### 🎯 Core Features

- **📱 QR Code Attendance** - Quick check-in via QR code scanning
- **📅 Session Management** - Create and manage attendance sessions
- **⚡ Real-time Updates** - Live attendance tracking with WebSocket
- **👥 User Management** - Role-based access control system
- **🏢 Department Organization** - Structure users by departments
- **📧 Email Notifications** - Automated session invitations
- **🔄 Recurring Sessions** - Support for repeated sessions
- **📎 File Attachments** - Attach documents to sessions

</td>
<td>

### 🔐 Security Features

- **🔑 JWT Authentication** - Secure token-based auth
- **🛡️ Role-based Access** - Admin, Teacher, Student roles
- **📝 Email Verification** - Verify user accounts
- **🔒 Secure File Upload** - Validated file handling
- **⏱️ Rate Limiting** - API request throttling
- **🚨 Error Handling** - Comprehensive error management
- **📊 Activity Logging** - Track user activities
- **🔐 Environment Config** - Secure configuration management

</td>
</tr>
</table>

## 🛠️ Tech Stack

### Backend 🖥️
<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=flat-square&logo=sequelize&logoColor=white" alt="Sequelize" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

### Frontend 🎨
<p>
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white" alt="Axios" />
</p>

## 📁 Project Structure

```bash
📦 Attendance_tracker/
├── 🖥️ backend/
│   ├── 📂 src/
│   │   ├── ⚙️ config/         # Configuration files
│   │   ├── 🎮 controllers/    # Request handlers
│   │   ├── 🛡️ middleware/     # Custom middleware
│   │   ├── 📊 models/         # Database models
│   │   ├── 🛣️ routes/         # API routes
│   │   ├── 💼 services/       # Business logic
│   │   ├── 🔌 sockets/        # WebSocket handlers
│   │   └── 🔧 utils/          # Utility functions
│   ├── 🧪 tests/              # Test files
│   └── 📤 uploads/            # File uploads directory
├── 🎨 frontend/
│   ├── 📂 src/
│   │   ├── 🧩 components/     # React components
│   │   ├── 📄 pages/          # Page components
│   │   ├── 🔗 services/       # API services
│   │   ├── 🔧 utils/          # Utility functions
│   │   └── 📝 types/          # TypeScript definitions
│   └── 🌐 public/             # Static assets
└── 📚 docs/                   # Documentation
```

## 🚀 Installation

### Prerequisites

- **Node.js** (v14 or higher) 🟢
- **PostgreSQL** (v12 or higher) 🐘
- **Redis** (for caching) 🔴
- **npm** or **yarn** 📦

### 🔧 Setup Instructions

1. **Clone the repository** 📥
   ```bash
   git clone https://github.com/willy4opera/Attendance_tracker.git
   cd Attendance_tracker
   ```

2. **Install backend dependencies** 📦
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies** 📦
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables** ⚙️
   
   Create `.env` files in both `backend/` and `frontend/` directories:

   **Backend `.env`:**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=attendance_tracker
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d

   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@attendancetracker.com

   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend `.env`:**
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_SOCKET_URL=http://localhost:3000
   ```

5. **Set up the database** 🗄️
   ```bash
   cd backend
   npm run migrate
   npm run seed  # Optional: seed with sample data
   ```

## 🏃‍♂️ Usage

### Development Mode 🛠️

1. **Start Redis server** 🔴
   ```bash
   redis-server
   ```

2. **Start backend server** 🖥️
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend server** 🎨
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application** 🌐
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

### Production Mode 🚀

1. **Build frontend** 📦
   ```bash
   cd frontend
   npm run build
   ```

2. **Start production server** 🏭
   ```bash
   cd backend
   npm start
   ```

## 📖 API Documentation

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/refresh-token` | Refresh JWT token |

### 👥 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/profile` | Get current user profile |

### 📅 Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get all sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session details |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/sessions/:id/qrcode` | Generate session QR code |

### ✅ Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/mark` | Mark attendance |
| GET | `/api/attendance/session/:id` | Get session attendance |
| GET | `/api/attendance/user/:id` | Get user attendance |
| POST | `/api/attendance/scan-qr` | Scan QR for attendance |

## 🧪 Testing

### Run Backend Tests 🖥️
```bash
cd backend
npm test                 # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage   # Generate coverage report
```

### Run Frontend Tests 🎨
```bash
cd frontend
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** 🍴
2. **Create your feature branch** 🌿
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes** 💾
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch** 📤
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** 🔄

### 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build process or auxiliary tool changes

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: icare@williamsobi.com.ng
- 🐛 Issues: [GitHub Issues](https://github.com/willy4opera/Attendance_tracker/issues)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools

---

<div align="center">
  <p>Made with ❤️ by Williams Obi</p>
  <p>
    <a href="https://github.com/willy4opera/Attendance_tracker">⭐ Star us on GitHub</a>
  </p>
</div>

## 👨‍💻 Developer

<div align="center">
  <h3>Williams Obi</h3>
  <p>
    <a href="mailto:icare@williamsobi.com.ng">
      <img src="https://img.shields.io/badge/Email-icare@williamsobi.com.ng-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
    </a>
    <a href="https://williamsobi.com.ng">
      <img src="https://img.shields.io/badge/Website-williamsobi.com.ng-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website" />
    </a>
    <a href="tel:+2348030756350">
      <img src="https://img.shields.io/badge/Phone-+234_803_075_6350-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Phone" />
    </a>
    <a href="https://github.com/willy4opera">
      <img src="https://img.shields.io/badge/GitHub-willy4opera-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
    </a>
  </p>
</div>
# Test SSH key deployment - Thu Jul 24 12:54:58 PM WAT 2025

## 🛠️ Deployment Scripts

The project includes several deployment and setup scripts:

### Setup Scripts

- **`scripts/setup-directories.sh`** - Creates all required upload directories
- **`scripts/pre-deploy-check.sh`** - Runs pre-deployment health checks

### Deployment Scripts

- **`scripts/deploy/deploy.sh`** - Main deployment script
- **`scripts/deploy-and-monitor.sh`** - Quick deploy with monitoring
- **`.github/workflows/deploy.yml`** - Automated GitHub Actions deployment

### Usage

```bash
# Setup directories (run once after cloning)
./scripts/setup-directories.sh

# Check if ready for deployment
./scripts/pre-deploy-check.sh

# Deploy to production
./scripts/deploy/deploy.sh production

# Quick deploy with monitoring
./scripts/deploy-and-monitor.sh "Deployment message"
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
