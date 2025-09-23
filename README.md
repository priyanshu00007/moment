
# Moment Productivity App

Moment is a full-stack productivity application designed to help users manage tasks, track goals, optimize focus sessions, and improve overall productivity. It combines modern UI/UX with AI-powered assistance and Pomodoro techniques to create a personalized productivity experience.

## Features

- **Task Management**: Add, edit, delete, and track tasks with intuitive modals and cards.
- **Goal Tracking**: Set and monitor personal or professional goals.
- **Pomodoro Timer**: Start focus sessions, customize Pomodoro settings, and review session history.
- **AI Assistant**: Get productivity tips, task suggestions, and motivational content powered by AI.
- **Profile & Data Management**: Edit your profile, manage productivity data, and clear profile information securely.
- **Dashboard**: Visualize your productivity stats, recent activity, and progress.
- **Authentication**: Secure sign-in and sign-up flows for user accounts.
- **Backend API**: Node.js/Express backend with RESTful endpoints for tasks, goals, Pomodoro sessions, and user management.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT-based auth middleware
- **AI Integration**: Custom AI assistant logic

## Folder Structure

- `app/` - Next.js frontend components, pages, and modals
- `backend/` - Node.js backend, controllers, models, routes, services
- `components/` - Shared UI components (Avatar, Button, Card, etc.)
- `lib/` - Utility functions
- `public/` - Static assets

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository**
	```sh
	git clone https://github.com/priyanshu00007/moment.git
	cd moment
	```
2. **Install dependencies**
	```sh
	npm install
	cd backend
	npm install
	```
3. **Configure environment variables**
	- Create a `.env` file in `backend/` for MongoDB URI and JWT secret.
	```env
	MONGODB_URI=your_mongodb_uri
	JWT_SECRET=your_jwt_secret
	```
4. **Start the backend server**
	```sh
	cd backend
	npm start
	```
5. **Start the frontend**
	```sh
	cd ..
	npm run dev
	```

## Usage

- Access the app at `http://localhost:3000`
- Sign up or sign in to your account
- Add tasks, set goals, and start Pomodoro sessions
- Use the AI assistant for productivity tips
- View your dashboard for progress tracking

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.

---

For more details, see the codebase and documentation in each folder.
