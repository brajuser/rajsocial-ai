# RajSocial AI — Quora & Reddit Assistant (Chrome extension)

Version 1.0.0 — local-first draft planner for Bodh Raj's personal brand.

## What works in this version
- Opens a full dashboard from the Chrome toolbar.
- Creates tailored ChatGPT prompts for Reddit, Quora, or both, using your experience and topic selection.
- Saves your personal voice profile, community guideline notes, and reviewed drafts in Chrome local storage.
- Offers a starter outline, copy actions, draft export, and links to each platform.
- Includes a pre-publish checklist to discourage repetitive or rule-breaking posts.

## Important limitations
- This version does not log into Reddit or Quora, read private account data, scrape communities, or publish automatically.
- It does not automatically fetch changing guidelines. Use the official links and each community's current rules; notes can become outdated.
- It does not include an AI model/API. It generates a carefully grounded prompt for use in ChatGPT. Paste ChatGPT's response into the final-post field, review it, then save/copy it.
- Quora does not provide a general public posting API suitable for this extension. Avoid browser automation that bypasses platform controls.
- Reddit API posting requires an appropriately registered/authorized application, OAuth credentials, and compliance with Reddit's current developer terms and policies. This MVP intentionally does not post via API.
- Chrome storage is local to this browser profile. Export drafts before clearing browser data or moving computers.

## Install in Chrome (unpacked extension)
1. Download and unzip `RajSocial-AI-Chrome-Extension.zip`.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Select **Load unpacked**.
5. Choose the unzipped `rajsocial-ai` folder containing `manifest.json`.
6. Pin **RajSocial AI — Quora & Reddit Assistant** to the toolbar if desired.
7. Click its toolbar icon to open the dashboard.

## Suggested first setup
1. Open **Your voice** and confirm the experience details. Add only truthful background and personal boundaries.
2. Open **Guidelines & safety** and add notes for communities you actually participate in.
3. In **Create a post**, select one content pillar and add a real experience or observation.
4. Click **Generate draft prompts**, copy the prompt into ChatGPT, review the response, and paste your edited post into **Your final post**.
5. Check the pre-publish checklist, save a copy, and publish manually on the platform after checking current rules.

## Privacy
No remote server or third-party analytics are used by this extension. Profile data, notes, and drafts are stored using `chrome.storage.local` in the local Chrome profile. The prompt is only sent to ChatGPT if you manually copy it into ChatGPT. Do not store passwords, access tokens, or other secrets in this extension.

## Files
- `manifest.json` — Chrome extension manifest (Manifest V3)
- `background.js` — opens the dashboard on toolbar click
- `dashboard.html`, `styles.css`, `dashboard.js` — dashboard and local draft workflow
