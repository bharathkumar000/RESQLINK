# RESQLINK - Disaster Resource Management System

## Problem Faced
Users were experiencing a "This site can't be reached" or "localhost refused to connect" error when trying to access the application on port 7070. This was caused because the Node.js server was not running, and the necessary dependencies (node_modules) were not installed.

## Solution
to resolve this:
1.  Missing dependencies were installed using `npm install`.
2.  The server was started using `npm start` (which runs `node server.js`).
3.  The application is now accessible at `http://localhost:7070`.

