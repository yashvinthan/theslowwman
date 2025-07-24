# The Slowwman Company Website

This repository contains the source code for The Slowwman Company's website, including both frontend and backend.

## Project Structure

```
.
├── backend/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── 404.html
│   ├── about.html
│   ├── admin.html
│   ├── contact.html
│   ├── index.html
│   ├── service-worker.js
│   └── services.html
├── package.json
├── robots.txt
└── sitemap.xml
```

## Backend

- Built with Node.js, Express, MongoDB (via Mongoose), and Nodemailer.
- Handles contact form submissions, admin authentication, and message storage.
- See [`backend/server.js`](backend/server.js) for implementation.

### Environment Variables

Set these in `backend/.env`:

```
ADMIN_PASSWORD=your_admin_password
MONGO_URI=your_mongodb_uri
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password
```

### Running the Backend

```sh
cd backend
npm install
npm start
```

## Frontend

- Static HTML, CSS, and JavaScript files.
- Includes animated backgrounds and a service worker for offline support.
- Main entry: [`frontend/index.html`](frontend/index.html)

## Service Worker

- Located at [`frontend/service-worker.js`](frontend/service-worker.js)
- Caches site assets for offline access.

## Development

- Start the backend server as above.
- Open `frontend/index.html` in your browser or serve the `frontend/` directory with a static server.

## License

[ISC](package.json)
