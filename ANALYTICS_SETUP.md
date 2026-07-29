# 📊 GitHub Pages Analytics & Metric Tracking Setup Guide

This guide explains how you (the site owner) can view **weekly and monthly visitor stats, pageviews, active sessions, and feature usage analytics** for your **Dice Roller** app hosted on **GitHub Pages**.

---

## 🎯 1. Built-in GitHub Traffic Insights (Free, Zero Setup)

Since your code is hosted on GitHub, GitHub automatically records visitor traffic for your repository and GitHub Pages site!

### How to View GitHub Insights:
1. Go to your GitHub repository on [github.com](https://github.com).
2. Click the **Insights** tab near the top right.
3. Select **Traffic** from the left sidebar.

### What You Get:
* **Unique Visitors**: Weekly and 14-day total unique visitor count.
* **Page Views**: Daily/weekly view graph.
* **Top Referring Sites**: Shows where your visitors are coming from (e.g. Reddit, Google, Twitter, direct links).
* **Popular Content**: Shows which pages receive the most hits.

*Note: GitHub keeps 14 days of historical data. For long-term monthly/yearly tracking and custom feature metrics, use Option 2 or Option 3 below.*

---

## 🚀 2. Google Analytics 4 (GA4) – (Recommended, Free Forever)

Google Analytics 4 gives you complete, professional-grade analytics:
* **Weekly/Monthly Active Users (WAU / MAU)**
* **Real-time Active Visitors & Map Location**
* **Event Tracking**: Counts of dice rolls, preset games loaded, custom dice created, themes picked, and backup downloads.

### Quick 2-Minute Setup:
1. Go to [analytics.google.com](https://analytics.google.com) and sign in with your Google account.
2. Click **Create Property** -> Name it `Dice Roller App`.
3. Under **Data Streams**, choose **Web** and enter your GitHub Pages URL (e.g., `https://username.github.io/diceRoller/`).
4. Copy your **Measurement ID** (it looks like `G-XXXXXXXXXX`).
5. Open `index.html` in your project and add the following 3 lines inside the `<head>` section:

```html
<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR_MEASUREMENT_ID');
</script>
```

Replace `G-YOUR_MEASUREMENT_ID` with your actual ID, commit, and push to GitHub Pages!

That's it! As the site owner, you can log into `analytics.google.com` on your computer or phone anytime to view real-time charts, monthly reports, and user retention.

---

## 🌿 3. GoatCounter or Cloudflare Web Analytics (Privacy-First Alternatives)

If you prefer a 100% cookie-free, privacy-first analytics provider without any Google accounts:

### Option A: GoatCounter (Free for Open Source)
1. Sign up at [goatcounter.com](https://www.goatcounter.com).
2. Add this single line to `index.html` inside `<head>`:
   ```html
   <script data-goatcounter="https://YOUR_CODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
   ```
3. View your traffic dashboard anytime at `https://YOUR_CODE.goatcounter.com`.

### Option B: Cloudflare Web Analytics (Free)
1. Sign up for free at [cloudflare.com](https://www.cloudflare.com) -> Web Analytics.
2. Paste the Cloudflare JS snippet into `index.html`.
