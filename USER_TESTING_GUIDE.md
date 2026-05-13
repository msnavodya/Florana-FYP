# Florana User Testing Guide

This guide is for manual user testing of the Florana project before demos, handovers, or release checks. It is written so another student, lecturer, or tester can clone the repository, run the project, and validate the important user flows without needing deep project knowledge.

## Goal

Use this guide to confirm that:

- the mobile app is usable for normal end users
- the backend responds correctly
- the admin dashboard opens and shows core data
- key flows do not break during a real user session

This is manual user acceptance testing, not automated unit testing.

## Recommended Test Environment

Use the project on a clean machine or a fresh clone when possible.

Required tools:

- Node.js 20 or later
- Python 3.11 or later
- npm
- Expo Go or an Android/iOS simulator
- MongoDB if you want the full database-backed flow

Recommended startup steps from the repository root:

```bash
npm run setup
npm run verify:full
npm run backend:start
npm run mobile:start
```

Optional admin dashboard check:

```bash
npm run admin:start
```

## Testing Commands

Use these commands from the repository root before or during manual testing:

```bash
npm run backend:test
npm run verify
npm run verify:full
.\.venv\Scripts\python.exe -m pytest backend\tests -q
```

What they do:

- `npm run backend:test` runs only the backend automated `pytest` suite
- `npm run verify` runs the main project verification checks
- `npm run verify:full` runs the full verification flow including the legacy web build
- the direct `pytest` command runs the backend test suite without npm

## Tester Roles

Use at least two kinds of testers if possible:

- New user: someone who has never used Florana before
- Returning user: someone who signs in again and tests saved data flows

If you have multiple testers, ask them to use different devices or accounts.

## Test Data Suggestions

Prepare these before the session:

- one valid new email address for signup
- one existing account for login testing
- one clear flower leaf image
- one unrelated image such as a person, room, or random object
- one product order path to test cart and checkout

## How To Record Results

For each test case, mark one result:

- `Pass`: works as expected
- `Partial`: mostly works but has a usability problem or minor bug
- `Fail`: broken, misleading, or blocked
- `Not Tested`: skipped

For failed or partial tests, record:

- screen name
- steps taken
- expected result
- actual result
- screenshot if available
- severity: `Low`, `Medium`, or `High`

## Core User Test Cases

### 1. Signup and Login

1. Open the app from a fresh session.
2. Register a new user with valid details.
3. Confirm the app moves into the main experience after registration.
4. Sign out.
5. Sign in again with the same account.

Expected result:

- validation messages appear for bad input
- signup succeeds with valid data
- login succeeds with the same account
- user greeting or profile details reflect the signed-in user

### 2. Invalid Auth Validation

1. Try registering with an invalid email.
2. Try registering with a short password.
3. Try logging in with missing fields.

Expected result:

- the app prevents submission
- clear validation messages are shown
- the app does not crash or freeze

### 3. Disease Diagnosis With Valid Leaf Image

1. Open the diagnosis flow from the home screen.
2. Upload one clear plant leaf image.
3. Wait for the prediction result.

Expected result:

- the image uploads successfully
- the result shows either healthy or diseased
- the message includes a meaningful prediction state
- the app stays responsive while loading

### 4. Disease Diagnosis With Invalid Image

1. Open the diagnosis flow again.
2. Upload an unrelated image such as a selfie, room photo, or object.

Expected result:

- the app rejects the image
- the app does not show a false disease alert
- the error message explains that only a clear plant leaf image is supported

### 5. Plant Registration

1. Open the plant registration screen.
2. Fill in the plant details.
3. Upload a plant image.
4. Save the plant.

Expected result:

- required fields are validated
- the save completes successfully
- the plant appears in the user's plant list

### 6. My Plants and Flower Profile

1. Open My Plants.
2. Tap a saved plant.
3. Check the flower profile details.
4. If growth tracking exists, open the growth chart view.

Expected result:

- the saved plant appears correctly
- plant details load without errors
- images and labels display correctly

### 7. Care Reminder

1. Open Care Reminder.
2. Set a valid watering time like `07:00`.
3. Add a custom note.
4. Toggle reminder options on and off.

Expected result:

- invalid times are rejected
- valid reminder settings save successfully
- note creation works
- the state remains visible after leaving and reopening the screen

### 8. Quick Tip Community

1. Open Quick Tips.
2. Create a post.
3. Like a post.
4. Add a comment.
5. Send a chat message if available.
6. Delete content owned by the current user.

Expected result:

- posts and interactions appear immediately
- sender identity is preserved correctly
- delete actions remove only owned content
- the screen remains stable after multiple actions

### 9. Shop Browsing

1. Open the catalog.
2. Browse seasonal products.
3. Open a product details screen.
4. Switch currency if available.

Expected result:

- products load correctly
- seasonal navigation works
- prices update consistently with the selected currency

### 10. Cart and Checkout

1. Add at least one item to the cart.
2. Open the cart.
3. Change quantity if supported.
4. Complete a checkout path using the available payment flow.

Expected result:

- cart totals are calculated correctly
- delivery details validation works
- the checkout flow completes or fails gracefully with a clear message

### 11. Sell Plant Flow

1. Open the sell flow.
2. Add a product name, price, season, and image.
3. Save the listing.

Expected result:

- image selection works
- invalid or missing fields are blocked
- the saved listing appears in the seller management area

### 12. Language Switching

1. Change the app language from settings or the language selector.
2. Visit Home, Care Reminder, Quick Tips, Register, and Cart.

Expected result:

- labels update consistently
- no important screen shows missing keys like `home_title`
- layout remains usable after translation changes

### 13. Settings, Feedback, Help, and About

1. Open Settings and change any available preferences.
2. Submit feedback.
3. Open Help and About.

Expected result:

- settings save correctly
- feedback submits successfully
- support pages render without layout issues

### 14. Admin Dashboard Smoke Test

1. Start the admin dashboard.
2. Open the dashboard summary.
3. Visit Users, Flower Plants, Orders or Payments, and Feedback.

Expected result:

- pages load successfully
- charts and tables render
- navigation works without blank screens

## Suggested Session Plan

Use this order for a 30 to 45 minute user test session:

1. Signup or login
2. Diagnosis with one valid and one invalid image
3. Register a plant
4. Open My Plants and profile
5. Try Quick Tips
6. Try Care Reminder
7. Browse catalog and cart
8. Submit feedback

## Release Readiness Criteria

Florana is ready for another user demo or review when:

- all High severity issues are resolved
- signup, login, diagnosis, plant registration, and cart flows pass
- invalid inputs do not crash the app
- unsupported diagnosis images do not produce false disease alerts
- language switching does not break core screens
- admin dashboard opens and loads its main routed pages

## Bug Report Template

Copy this format for each issue:

```text
Title:
Area:
Severity:
Tester:
Environment:
Steps to reproduce:
Expected result:
Actual result:
Screenshot or recording:
Notes:
```

## Test Run Summary Template

Copy this format at the end of a session:

```text
Test date:
Tester name:
Device:
Build used:
Backend status:
Database mode:
Total cases passed:
Total cases partial:
Total cases failed:
High severity issues:
Ready for demo: Yes / No
Notes:
```
