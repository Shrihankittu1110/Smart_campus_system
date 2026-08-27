# 🍽 SmartMess – Smart Canteen Management System

[![MongoDB](https://img.shields.io/badge/MongoDB-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![AI Chatbot](https://img.shields.io/badge/AI-Chatbot-blueviolet?style=for-the-badge)]()

---

## 📌 Description
**SmartMess** is a full-stack web application designed to modernize university canteen services by enabling digital meal ordering, cashless payments, and centralized system management.

The platform connects **students, canteen operators, and administrators** through a secure, role-based system that improves efficiency, transparency, and user convenience.

An integrated **AI chatbot** provides instant assistance, helping users navigate the system and resolve common queries.

SmartMess follows a **modular, scalable MERN architecture** that reflects real-world software system design.

---
🍽️ SmartMess – Smart Canteen Management System

A Smart, Secure and Digital Canteen Management Platform for University Campuses

SmartMess is a full-stack web-based smart canteen management platform designed to digitize university food ordering and canteen operations.
It connects students, canteen staff, and administrators through one centralized application.

📌 Project Overview

SmartMess allows students to browse canteens and meals, manage a cart, place orders, complete the checkout process, receive queue tokens, track live queue progress, and provide feedback.
Canteen staff can manage meals, process orders, manage queue tokens, monitor sales, and mark completed tokens.
Administrators can manage users, approve canteens, monitor complaints, moderate reviews, and view system analytics.
The system also provides an AI-powered chatbot assistant for common user queries.
The application follows a MERN-stack architecture and communicates through RESTful APIs.

🎯 Problem Statement

Traditional campus canteens commonly depend on manual ordering, physical queues, manual payment handling, and paper-based or disconnected tracking.

Common Problems

Long physical queues during peak hours

Unclear waiting times

Manual order-entry errors

Difficulty tracking active orders

Limited visibility into queue progress

Inefficient menu management

Difficult complaint and feedback handling

Limited sales and revenue visibility

💡 Proposed Solution

SmartMess provides a centralized digital platform that moves ordering and queue management online.
Students can order before reaching the counter and receive a queue token.
The live queue view shows the current token and helps students estimate when their order will be served.
Staff receive a dedicated queue-management view where tokens can be processed and marked as completed.
Administrators receive centralized controls for managing the overall platform.

🚀 Core Features

👤 1. User Authentication and Role Management

Student registration and login

Secure authentication

Logout functionality

Profile management

Role-based access control

Separate interfaces for students, staff/canteens, and administrators

🍽️ 2. Digital Canteen and Meal Browsing

View approved canteens

Browse available meals

View prices

Check availability

Browse by category

Select food items before ordering

🛒 3. Cart Management

Add meals to cart

Increase or decrease quantity

Remove items

View cart total

Proceed to checkout

📦 4. Online Order Management

Place orders digitally

View active orders

View previous orders

Track order status

View order details

Cancel eligible orders

🎟️ Smart Queue Token Management

Smart queue management is one of the core features of SmartMess.
It is designed to reduce physical crowding and provide students with visibility into their expected waiting time.

Queue Features

Generate queue tokens automatically for eligible orders

Assign a unique token to an order

Show the student's current token

Show the token currently being served

Display estimated waiting time

Display live queue status

Show pending and completed queue states

Provide a dedicated staff queue view

Allow staff to mark tokens as completed

Move the queue forward after completion

Queue Workflow

Student places order
        ↓
Order is confirmed
        ↓
Queue token is generated
        ↓
Student sees token number
        ↓
Current token and estimated wait time are displayed
        ↓
Live queue status is updated
        ↓
Staff processes the token
        ↓
Staff marks token as completed
        ↓
Next token becomes active

Token Generation

A token is generated when an order enters the queue according to the application's ordering workflow.
The token provides a simple reference number for the student and staff.
Tokens help separate the concept of an order from the physical serving sequence.

Current Token

The current token represents the token being processed by the staff.
Students can compare their token with the current token to understand their position in the queue.

Estimated Wait Time

The system displays an estimated waiting time based on the queue position and the configured queue-processing logic.
The estimate gives students a better idea of when they should approach the canteen.

Live Queue Status

The queue screen can display active queue information such as the current token, upcoming tokens, and completed tokens.
Live status reduces the need for students to repeatedly stand near the counter just to check progress.

Staff Queue View

Staff receive a queue-focused interface for managing active tokens.
Staff can view pending tokens, process the current token, and mark a token as completed.
After completion, the next token can become the active token.

Queue State Example

Token 101 → Completed
Token 102 → Completed
Token 103 → Current
Token 104 → Waiting
Token 105 → Waiting

🎓 Student Module

Canteen Browsing

Students can view approved canteens and explore their available food items.

Meal Selection

Students can select a meal, review its details, and add it to the cart.

Ordering

Students confirm their cart and create an order through the checkout process.

Queue Tracking

After an order receives a queue token, students can view the token and queue progress.

Order History

Students can view previous orders and their associated information.

Feedback

Students can submit ratings and reviews for meals and canteens.

🏪 Canteen / Staff Module

Canteen Profile Management

Manage canteen information

Manage operating information

Maintain the canteen profile

Meal Management

Add meals

Edit meals

Delete meals

Change prices

Enable or disable availability

Categorize meals

Order Processing

View incoming orders

Accept orders

Reject eligible orders

Start preparation

Update order status

Mark orders as completed

Queue Processing

View active queue tokens

Identify the current token

Process tokens in queue order

Mark completed tokens

Continue with the next waiting token

Revenue Monitoring

Monitor daily sales

Monitor monthly income

Review completed orders

Observe revenue trends

🛠️ Admin Module

Canteen Approval

Review registration requests

Approve canteens

Reject applications

Enable canteen visibility

Disable canteen visibility

User Management

Monitor users

Block users

Unblock users

Manage platform access

Complaint Management

View complaints

Investigate issues

Update complaint status

Resolve complaints

Maintain complaint history

System Analytics

Monitor total users

Monitor total orders

Monitor canteen activity

Monitor system activity

Review overall platform usage

Review Moderation

Monitor submitted reviews

Moderate inappropriate content

Maintain review quality

💳 Payment System

SmartMess includes a digital checkout and payment workflow.

Payment Capabilities

Checkout

Payment processing interface

Payment success or failure handling

Transaction storage

Association between payment and order

The current project documentation describes the payment workflow as a development/demo-oriented implementation.

⭐ Ratings and Feedback

Students can submit ratings and reviews after using the canteen service.
Feedback can help staff understand customer satisfaction and identify areas for improvement.

Feedback Flow

Student completes order
        ↓
Student submits rating/review
        ↓
Review is stored
        ↓
Staff/Admin can monitor feedback

🚨 Complaint Management

Students and canteen operators can submit complaints.
Administrators can review and resolve reported issues.

Complaint Flow

Complaint Submitted
        ↓
Admin Review
        ↓
Investigation
        ↓
Resolution
        ↓
Complaint Closed

🤖 AI Chatbot Assistant

SmartMess includes an AI-powered chatbot assistant.
The assistant can help users with common application and ordering questions.

Example Questions

How can I order food?

Where can I check my order?

How can I view my queue token?

What is the current token?

How can I check my waiting time?

How do I use the canteen system?

Example

Student: How can I order food?

Assistant: Open the canteen section, select a canteen,
choose a meal, add it to the cart, and proceed to checkout.

🏗️ System Architecture

SmartMess follows a client-server architecture based on the MERN stack.

                 Student / Staff / Admin
                           │
                           ▼
                 ┌──────────────────┐
                 │  React Frontend  │
                 │ Vite + Tailwind  │
                 └────────┬─────────┘
                          │
                     REST APIs
                          │
                          ▼
                 ┌──────────────────┐
                 │ Node.js + Express │
                 │    Backend API    │
                 └────────┬─────────┘
                          │
                 Business Logic
                 Authentication
                 Queue Management
                          │
                          ▼
                 ┌──────────────────┐
                 │     MongoDB      │
                 │  MongoDB Atlas   │
                 └──────────────────┘

Architecture Responsibilities

Frontend handles user interaction and presentation.

Backend handles API requests and business logic.

Authentication protects restricted resources.

Queue logic manages token sequencing and status.

MongoDB stores application data.

🧰 Technology Stack

Frontend

React.js

JavaScript

Tailwind CSS

Vite

Backend

Node.js

Express.js

RESTful APIs

Database

MongoDB

MongoDB Atlas

Security

JWT authentication

Role-based authorization

Protected API routes

Environment variables

Development Tools

Visual Studio Code

Git

GitHub

Postman

Playwright

📂 Project Structure

Smart_campus_system/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
│
├── scripts/
├── tests/
├── package.json
├── package-lock.json
├── playwright.config.js
└── README.md

🗄️ Database Design

MongoDB is used as the primary database.
The system stores users, canteens, meals, orders, payments, queue information, reviews, and complaints according to the implemented application model.

Main Relationships

User
 ├── Student
 ├── Staff/Canteen
 └── Admin

Canteen
 └── Meals

Student
 ├── Cart
 ├── Orders
 ├── Payments
 ├── Queue Tokens
 └── Reviews

User
 └── Complaints

Queue Data Concept

A queue record is associated with an order and identifies the serving sequence.
Typical queue information can include a token number, order reference, status, and timing information depending on the implementation.

🔐 Security

Security is an important part of SmartMess.

Security Measures

JWT-based authentication

Role-based authorization

Protected API routes

Password authentication

Environment variables for secrets

Server-side validation

Restricted administrative functionality

Database credentials and JWT secrets must not be committed to GitHub.

🔌 API Architecture

The backend exposes RESTful APIs for frontend communication.

Typical Operations

POST    /api/auth/register
POST    /api/auth/login
POST    /api/auth/logout

GET     /api/canteens
POST    /api/canteens

GET     /api/meals
POST    /api/meals
PUT     /api/meals/:id
DELETE  /api/meals/:id

GET     /api/orders
POST    /api/orders
PUT     /api/orders/:id
DELETE  /api/orders/:id

GET     /api/complaints
POST    /api/complaints

GET     /api/reviews
POST    /api/reviews

Exact endpoint names should remain synchronized with the implemented backend routes.

🎟️ Queue API Responsibilities

Queue-related APIs should support the core queue workflow implemented by the application.

Required Operations

Create or generate a token for an eligible order

Retrieve queue status

Retrieve the current token

Retrieve estimated waiting time

Retrieve a student's token information

Allow staff to update token status

Mark a token as completed

Advance to the next token

Queue Status Example

{
  "token": 103,
  "status": "waiting",
  "currentToken": 101,
  "estimatedWaitMinutes": 10
}

⚙️ Installation and Setup

Prerequisites

Node.js 18+

npm

Git

MongoDB or MongoDB Atlas

Visual Studio Code

Clone Repository

git clone https://github.com/Shrihankittu1110/Smart_campus_system.git
cd Smart_campus_system

Backend Setup

cd backend
npm install

Environment Variables

Create a .env file inside the backend directory.

PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173

Never commit .env to GitHub.

Start Backend

npm start

Frontend Setup

Open another terminal and run:

cd frontend
npm install
npm run dev

The development frontend normally runs on http://localhost:5173.
The backend normally runs on http://localhost:5000.

🌐 MongoDB Atlas Setup

SmartMess can use MongoDB Atlas as its cloud database.

Steps

Create a MongoDB Atlas account.

Create a cluster.

Create a database user.

Configure network access.

Copy the connection string.

Add the connection string to the backend .env file.

Example:

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>

🧪 Testing

Testing should cover authentication, authorization, ordering, queue management, staff operations, complaints, reviews, and administration.

Main Testing Areas

Authentication
      ↓
Authorization
      ↓
Meal Management
      ↓
Cart
      ↓
Orders
      ↓
Queue Token Generation
      ↓
Current Token Display
      ↓
Estimated Waiting Time
      ↓
Live Queue Status
      ↓
Staff Token Completion
      ↓
Payments
      ↓
Complaints
      ↓
Reviews
      ↓
Admin Functions

🧪 Queue Test Cases

Test Case

Expected Result

Place eligible order

Queue token is generated

View token

Student sees assigned token

View current token

Current serving token is displayed

View waiting time

Estimated wait is displayed

Refresh queue

Latest queue status is shown

Staff opens queue

Active tokens are visible

Staff completes token

Token becomes completed

Next token

Queue advances correctly

Completed token

Token is no longer active

Unauthorized staff action

Access is denied

🧪 General Test Cases

Test Case

Expected Result

Student login

Student dashboard opens

Invalid login

Error message appears

Add meal

Meal appears in cart

Remove meal

Meal is removed

Place order

Order is created

Canteen accepts order

Order status updates


## 🚀 Installation & Setup Guide

## 📌 Prerequisites

Make sure you have installed:

- Node.js (v18 or above)
- MongoDB (Local or MongoDB Atlas)
- Git
- VS Code

---


## 📦 2️⃣ Backend Setup

```bash
cd backend
npm install
```

### 🔐 Create `.env` File in Backend Folder

Create a file named `.env` and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### ▶ Run Backend Server

```bash
npm start
```

Server will run on:

```
http://localhost:5000
```

---

## 💻 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

## 🧪 API Testing

- Postman to test backend APIs

---

## 🎓 Project Details

**Academic Year:** 3rd Year – 1st Semester  
**Module:** IT Project Management (ITPM)  
**Team Size:** 4 Members  
**Contribution Areas:**
- User Authentication & Authorization  
- Student Ordering & Payment System  
- Canteen Management & Revenue Tracking  
- Admin Oversight & Complaint Handling  
- AI Chatbot Integration  



