# Smart AI-Based Photo Organizer & Auto-Editing Web Platform (Backend)

## 🚀 Project Overview
This repository contains the backend infrastructure for the Smart AI-Based Photo Organizer. The system is designed to provide a privacy-first, MERN-stack solution for managing and enhancing large photo libraries. By integrating browser-side AI with a robust Node.js/MongoDB backend, it ensures that sensitive user data remains local while providing powerful organization and editing capabilities.

**Group ID:** F25CS202  
**Advisor:** Ma’am Sehar Ali  
**University:** University of Central Punjab (UCP)

---

## 👥 Team Members
* **Saif ur Rehman (L1F22BSCS0120)** - Frontend & Image Processing  
* **Abdul Rahim (L1F22BSCS0152)** - AI Modules & Backend  

---

## 🛠 Tech Stack
- **Server:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Security:** JWT (JSON Web Tokens), Bcrypt.js
- **Image Processing:** Sharp (Server-side thumbnailing)
- **File Handling:** Multer

---

## 🏗 System Architecture
The backend follows a MVC (Model-View-Controller) architecture to maintain a clean separation of concerns.



- **Models:** Defined using Mongoose for Users, Photos, and Albums.
- **Controllers:** Logical implementation of Authentication, Image Processing, and AI Metadata Sync.
- **Routes:** RESTful API endpoints.
- **Middleware:** Security layers for JWT authentication and error handling.

---

## 🔑 Key Features (Backend Implementation)
- **Secure Authentication:** JWT-based login/register system with hashed passwords.
- **AI Metadata Sync:** Specialized endpoints to receive and store browser-calculated quality scores, face counts, and scene categories.
- **Image Management:** Automated thumbnail generation to ensure high-performance gallery rendering.
- **Trash & Review System:** Logic to flag and manage low-quality/blurry images based on AI analysis.
- **Smart Albums:** API support for auto-categorization of photos into albums.

---

## 📂 Repository Structure
├── config/             # Database connection settings
├── controllers/        # Business logic for API endpoints
├── middleware/         # Auth protection and error handlers
├── models/             # Mongoose schemas (User, Photo, Album)
├── routes/             # API route definitions
├── uploads/            # Local storage for user photos
├── .env                # Environment variables (Hidden)
├── server.js           # Main entry point
└── package.json        # Dependencies and scripts


---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed
- MongoDB (Local or Atlas) account

### 2. Installation
```bash
git clone [https://github.com/YourRepo/Smart-AI-Photo-Organizer-API.git](https://github.com/YourRepo/Smart-AI-Photo-Organizer-API.git)
cd Smart-AI-Photo-Organizer-API
npm install
