# DraftEdge — Product Blueprint

Here is the complete product blueprint for **DraftEdge**, a 100% free, open-source fantasy football draft assistant and cheat sheet web application.

---

## Part 1: The Public Landing Page (Pre-Authentication)

When users first visit the URL, they encounter a high-conversion, modern landing page designed to explain the value of the tool before prompting them to sign in or sign up.

### 1. Hero Section

* **Headline:** *Master Your Fantasy Draft. Zero Cost. Maximum Advantage.*
* **Sub-headline:** *An intelligent, real-time draft companion featuring automated tiers, live pick tracking, and custom cheat sheets powered by open data.*
* **Primary Call-to-Action (CTA) Buttons:**
* **"Get Started Free"** (Prominent primary button that opens the Registration modal/page).
* **"Sign In"** (Secondary button for returning users).

* **Visual Asset:** A sleek, high-definition mockup of the dark-mode draft board interface showing color-coded player tiers and a live countdown draft clock.

### 2. Feature Highlights Section (3-Column Grid)

* **Tier-Based Rankings:** Move beyond rigid numerical lists. Group players into visual tiers so you never miss a positional run.
* **Real-Time Draft Sync:** Cross off players as they fly off the board in your actual league draft and instantly see updated value projections.
* **100% Free & Open Data:** Powered directly by public NFL and Sleeper data feeds with zero subscription fees or hidden paywalls.

### 3. How It Works (3-Step Walkthrough)

1. **Configure Your League:** Input your scoring format (PPR, Half-PPR, Standard) and league size (e.g., 12-team).
2. **Open Your Cheat Sheet:** Access your custom-sorted dashboard optimized for desktop or mobile tablet view.
3. **Dominate Your Draft:** Check off players as your league drafts, track your roster balance, and secure your championship trophy.

### 4. Footer & Trust Badges

* Open-source repository link (GitHub badge).
* Simple copyright notice: *DraftEdge is a community-built fantasy football companion.*

---

## Part 2: Authentication & Onboarding Workflow

Once a user clicks **"Get Started Free"**, they go through a lightweight authentication and setup flow.

* **Authentication Screen:** Simple email/password signup and Google OAuth login via Supabase or Firebase free tier.
* **Quick Setup Wizard (First-Time Users Only):**
* **League Name:** (e.g., "The Office League")
* **Scoring Format Selector:** Radio buttons for *PPR (Points Per Reception)*, *Half-PPR*, or *Standard*.
* **Draft Position Selector:** Dropdown to select your draft slot (e.g., Pick #4 in a 12-team snake draft).
* **Roster Template:** Quick configuration of starting slots (1 QB, 2 RB, 2 WR, 1 TE, 1 Flex, 1 K, 1 DEF, 5 Bench).

---

## Part 3: The Main Dashboard & Draft Room

The core of the application is a high-density, lightning-fast dashboard designed to be stared at for hours during draft day.

### 1. Header Navigation Bar

* **App Branding:** *DraftEdge* logo + active league name badge.
* **Draft Status Pill:** Shows status (*Pre-Draft*, *Draft Live*, or *Completed*).
* **User Profile Menu:** Settings, League Config, and Log Out.

### 2. Control & Filter Panel (Left Sidebar / Top Bar)

* **Live Search Bar:** Instant type-to-filter for any NFL player by name.
* **Position Filter Buttons:** Quick toggle pills for `ALL`, `QB`, `RB`, `WR`, `TE`, `K`, `DEF`.
* **View Modes:** Toggle between **Table View** and **Grid/Tier View**.
* **Quick Actions:** "Reset Draft Board", "Export Roster to CSV".

### 3. The Interactive Cheat Sheet Table (Center Stage)

A data-dense, sortable table displaying player data pulled from the free data pipeline:

* **Columns:**
* **Status Icon:** A checkbox or "Drafted" action button.
* **Tier Badge:** Color-coded pill (e.g., Tier 1 = Gold, Tier 2 = Blue, Tier 3 = Green).
* **Rank / ADP:** Overall rank vs. Average Draft Position.
* **Player Name & Team:** Name, NFL Team abbreviation, and Bye Week.
* **Position:** Primary position (RB, WR, etc.).
* **Projections:** Projected total points and weekly average.
* **Notes / Action:** A text box allowing users to type custom personal notes on any player (e.g., *"Target in round 4"*).

---

## Part 4: The Live Draft Tracking & Roster System

As the user or their league drafts players, the app dynamically updates.

### 1. The Cross-Off & Draft Logging Engine

* Clicking the **"Draft"** button next to a player instantly:
* Grays out and strikes through the player on the main cheat sheet.
* Automatically assigns the player to the user's roster (if it's their pick) or logs them to the general draft log.
* Recalculates remaining positional value in real-time.

### 2. User Roster Side-Panel

* A persistent right-hand drawer or sidebar showing the user’s current drafted team structure:
* **QB:** [Empty / Drafted Player]
* **RB1 / RB2:** [Slots update dynamically]
* **WR1 / WR2:** [Slots update dynamically]
* **TE / Flex / Bench:** [Slots update dynamically]

* **Positional Needs Warning:** Visual indicators that alert the user if they are neglecting a critical position (e.g., *"Warning: You have 0 TEs and only 3 rounds remaining"*).

---

## Part 5: Data Engine & Architecture Summary ($0 Stack)

* **Frontend:** React / Next.js hosted on **Vercel** (Free Tier) with Tailwind CSS for rapid, responsive UI styling.
* **Backend / State Management:** Client-side React state combined with lightweight local storage persistence (or a free **Supabase** PostgreSQL database tier to save user league settings and custom notes).
* **Data Source:** A scheduled Python script or serverless API route that fetches fresh player metadata, team rosters, and baseline projections directly from the public **Sleeper API** and **`nfl_data_py`** repositories before draft season begins.
