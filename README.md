# CanCare Web Admin Dashboard

CanCare is a cancer care management assistant project. This repository contains the web dashboard side of the system, focused on Chief/Admin oversight and Clerk/Registration desk workflows.

## Purpose

The dashboard is designed to support admin and registration operations for a cancer care management workflow, including patient records, care team directories, appointments, notifications, and community updates.

## Scope

- Chief/Admin: oversees patients, doctors, nurses, appointments, notifications, community posts, and operational activity.
- Clerk/Registration: manages daily registration, patient records, care team lookup, and appointment scheduling.
- Patient, doctor, and nurse mobile experiences are separate from this repo and are represented only through portfolio screens/prototype materials.

## Demo Safety

All visible data in this web demo is fictional. The public portfolio demo does not require real Firebase credentials. Firebase login/register remains optional, while demo access is available for quick review.

## Demo Access

- Chief/Admin demo: use **Enter as Chief / Admin** on the login page.
- Clerk demo: use **Enter as Clerk** on the login page.

## Tech Stack

- React
- Create React App
- React Router
- Firebase auth/firestore hooks for optional real-account fallback
- Recharts
- React Calendar
- CSS modules/files with a custom healthcare dashboard visual system

## Run Locally

```bash
npm install --legacy-peer-deps
npm start
npm run build
```
