# File Upload Assessment Frontend

This project is a Next.js dashboard for managing users and file uploads with a backend API and presigned S3 uploads.

## Overview

The app has three main areas:

- Authentication pages for login, register
- Dashboard pages for uploads and users
- A file detail page for shared or direct file access

The frontend talks to the backend through `NEXT_PUBLIC_API_URL`.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Sonner for toast messages
- Lucide React icons
- Base UI components

## Project Routes

- `/` landing page
- `/login`
- `/register`
- `/dashboard/uploads`
- `/dashboard/users`
- `/files/[id]`

## Setup

### Install

```bash
npm install
```

### Environment

Set the backend URL in `.env`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Core Process

### 1. Authentication

Users log in or register through the auth pages. After login, the dashboard uses the authenticated session for API requests.

### 2. Dashboard Shell

`DashboardSidebar` is the shared left panel on dashboard pages. It shows:

- Current user name, email, and role
- Navigation context for uploads or users
- Logout action

### 3. Upload Workflow

The upload flow is split into two steps:

1. Request a presigned upload URL from the backend.
2. Upload the file directly to S3 using that presigned URL.
3. Save the upload metadata back to the API.

#### Upload API flow

- `POST /uploads/presign`
- Direct S3 upload using the returned `uploadUrl`
- `POST /uploads` for a new record
- `PATCH /uploads/:id` for updates
- `DELETE /uploads/:id` for removal
- `GET /uploads` to load the list

#### Upload data captured

- File name
- Description
- Visibility status
- File size
- MIME type
- S3 key
- Share link or public download link

#### Upload use cases

- Add a new file to the workspace
- Replace an existing file
- Update description or visibility
- Download a file from the table
- Copy the download link from the table
- Delete a file from the dashboard

### 4. File Access

Upload items use a download route based on the record ID:

- `/uploads/:id/download`

This route is used by the upload table download action and the copied link.

### 5. User Management Workflow

The users page loads:

- Current profile from `GET /users/profile`
- All users from `GET /users`

It supports:

- Searching users by name, email, or role
- Viewing a table of users
- Toggling user status between active and inactive

#### User status API

- `PATCH /users/:id/status`

The action column contains the status badge and the on/off checkbox for each user.

#### User use cases

- Review all registered users
- Find a user quickly with search
- Mark a user active
- Mark a user inactive
- See how many admin and regular users exist

## File Handling Notes

- Large files are checked in the upload dialog before sending anything to the backend.
- The upload record stores `s3Key` so the backend can reference the uploaded object reliably.
- The frontend normalizes API responses that may return either a raw object or a `data` wrapper.

## API Summary

### Uploads by user role

- `GET /uploads`
- `POST /uploads/presign`
- `POST /uploads`
- `PATCH /uploads/:id`
- `DELETE /uploads/:id`
- `GET /uploads/:id/download`

### Users Management by admin role

- `GET /users`
- `GET /users/profile`
- `PATCH /users/:id/status`

### Auth

- `POST /auth/logout`

## Development Notes

- The app uses client components for dashboard interactivity.
- Toast messages are used for success and error feedback.
- The dashboard refreshes data after create, update, and delete actions so the UI stays in sync with the backend.

## Common Scenarios

- A user uploads a file, adds a description, and marks it public.
- A user updates an existing upload without changing the file.
- An admin searches the user list and flips a user between active and inactive.
- A user copies a download URL to share with someone else.

