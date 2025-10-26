# 🚚 Swift App

[![Tests](https://github.com/slashforyou/swift-app/workflows/Tests/badge.svg)](https://github.com/slashforyou/swift-app/actions)
[![Node.js](https://img.shields.io/badge/node-20.x-brightgreen.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/react--native-0.76.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

A mobile application for moving companies, offering smooth management of jobs, clients, notes, items, and routes.

## Project Description

Swift App is a solution designed to help moving companies digitize and simplify their day-to-day operations. It provides a unified interface to organize moving jobs, track client information, add notes per job, manage items to be moved, and plan routes on an integrated map. The goal is to centralize all data for a move to increase efficiency and visibility from the first client contact through job completion.

## Key Features

- Move job management – Create and schedule jobs with full tracking (status, date, details). Each job can include multiple steps (e.g., pickup, intermediate storage, delivery) to reflect the real-life flow of a move.

- Client information management – Store client details and contacts per job. Quick access to client info (name, phone, email) with built-in buttons to call or send a message.

- Notes and comments per job – Add and view notes tied to a job (special instructions, field notes, etc.), shown in a dedicated tab so teams can keep written records of important points.

- Inventory of items to move – Manage the list of objects/boxes to transport for each job, with quantities and indicators. The job UI lets you tick items and update their status in real time (via a simple switch on each item).

- Route planning – Map integration to visualize pickup and drop-off addresses. Open the location in the device’s map app (Google Maps, Apple Maps) to get the best route.

- Agenda / calendar view – Calendar display of scheduled jobs with month/year/day views for a global planning perspective.

- Notifications and status tracking – Planned notification system to remind deadlines (e.g., upcoming job, status changes) and track job status (pending, in progress, completed, etc.).

- User authentication – User account management with sign up and sign in (to be implemented), so each employee has personalized access.

- Electronic contract signature – Let the client sign the service contract directly in the app via a signature capture component. The signature is saved and attached to the corresponding job.

- **Payment processing** – Complete payment system with credit card validation, multiple payment methods (card/cash), saved cards management, and real-time Luhn algorithm validation. Features an interactive credit card preview with visual feedback and modern UI design.

Note: The project is currently in active development (version 0.0.1). Core features like job management, calendar views, and payment processing are implemented. Authentication and signature features are planned for upcoming versions.

## Technical Overview

- Mobile framework: React Native with Expo (managed workflow) for cross-platform iOS/Android builds and easy access to native APIs. The codebase is written in TypeScript for type safety and maintainability.

- Navigation: React Navigation (Stack/Tabs) to organize screens (e.g., home, calendar, job details) and nested calendar views (monthly/yearly).

- Architecture: Feature-oriented modular structure — the app is organized by domain (e.g., a features/jobs module for job management) to group related screens, components, and hooks for better scalability and clearer ownership.

- Global state: A store/ folder is reserved for global state management (e.g., Redux Toolkit or Context API) to centralize data such as the authenticated user or upcoming jobs.

- Quality & tests: ESLint + Prettier for consistent code quality. Unit/UI tests with Jest and Testing Library for React Native, with a dedicated tests/ directory.

## Installation (Expo development)

Prerequisites

Node.js (LTS recommended)

npm or Yarn

Expo Go app on your mobile device (for quick testing)

### Steps

1 - Clone the repo to your machine.

2 - Install dependencies:
```bash
npm install
# or
yarn
```
3 - Running the project locally

Start the Expo dev server from the project root:
```bash
npx expo start
```
Then:

On a mobile device: scan the QR code with Expo Go (iOS/Android).
On a simulator/emulator: press i (iOS, macOS required) or a (Android) in the terminal. Ensure a simulator/emulator is installed and running.

Hot reload will reflect code changes instantly.

## Build & Deployment

You can generate production builds using Expo tooling:

EAS Build (recommended) – Use Expo Application Services to build in the cloud:
```bash
eas build --platform android
eas build --platform ios
```
Requires an Expo account and (optionally) an eas.json config. You’ll receive a link to download the .apk/.aab (Android) or .ipa (iOS) for store submission.

Classic Expo CLI build – Legacy commands (Expo now favors EAS):
```bash
expo build:android
expo build:ios
```
Prefer EAS for modern SDKs and App Store/Play Store requirements.

After distribution, you can also use Expo Publish to deliver OTA (over-the-air) updates without a full store release.

## Project Structure

```bash
assets/          # Images, icons, fonts, etc.
src/
├── components/  # Reusable UI components
├── config/      # App configuration (routes, themes, constants)
├── features/    # Domain-based modules (screens, components, hooks per feature)
│   └── jobs/    # Example feature: moving job management
│       ├── components/
│       ├── hooks/
│       └── screens/
├── navigation/  # App navigators (Stacks, Tabs)
├── screens/     # Top-level screens (e.g., Auth, Home)
├── services/    # Utilities/services (APIs, maps, local storage, etc.)
├── store/       # Global state management
└── utils/       # Generic utility functions

tests/           # Automated tests (Jest, Testing Library)
```

This modular, feature-first layout keeps domain logic and UI together and makes it easier to evolve the app with minimal cross-feature side effects.

## Authors, License & Contributing

Primary author: Romain Giovanni (GitHub @slashforyou).

License: No open-source license specified yet (private project). Code is not available for public reuse unless stated otherwise in the repository. This may change if the project becomes open-source later.

Contributing: Suggestions and feedback are welcome. Please open issues for bugs or feature ideas. Pull requests are encouraged—fork the repo and submit changes for review. Follow project standards (linting, tests) for a smooth merge.

Thanks for your interest in Swift App—hope it helps you manage moves more efficiently 🚀.