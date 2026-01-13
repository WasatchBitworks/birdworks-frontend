# Netlify Build Hook Setup Guide

This document explains how to set up hourly automated builds on Netlify for the Wasatch BirdWorks frontend.

**Status:** ✅ **COMPLETE** (January 12, 2026)
- GitHub Actions workflow: `.github/workflows/scheduled-build.yml` ✅
- Netlify build hook: Created ✅
- GitHub secret `NETLIFY_BUILD_HOOK`: Added ✅
- Automatic hourly builds: **ACTIVE** 🚀

---

## Quick Setup (2 Steps)

### Step 1: Create Netlify Build Hook

1. Go to **Netlify Dashboard** → Your site
2. Navigate to **Site settings** → **Build & deploy** → **Continuous deployment** → **Build hooks**
3. Click **Add build hook**
4. Enter name: `Scheduled Hourly Build`
5. Select branch: `main`
6. Click **Save**
7. Copy the webhook URL (looks like: `https://api.netlify.com/build_hooks/XXXXX`)

### Step 2: Add GitHub Secret

1. Go to your **GitHub repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NETLIFY_BUILD_HOOK`
4. Value: Paste the webhook URL from Step 1
5. Click **Add secret**

---

## How It Works

**Workflow File:** `.github/workflows/scheduled-build.yml`

**Schedule:** Hourly during 6am–10pm Mountain Time (17 builds/day)
- Runs at: `:00` (top of each hour)
- Time window: 6am MST to 10pm MST
- During PDT/MDT (Mar–Nov): Adjusts automatically
- Overnight: No builds (cost & resource efficient)

**Trigger:** When scheduled time arrives, GitHub Actions:
1. Sends HTTP POST to Netlify build hook
2. Netlify receives request and starts build
3. Eleventy fetches fresh data from Birds API
4. Static site regenerated
5. Deployed to wasatchbirdworks.com

**Status Check:**
- GitHub: View workflow runs at **Actions** tab
- Netlify: View builds at **Deploys** tab (live link shows build status)

---

## Verification Checklist

After completing the 2 setup steps:

- [ ] Build hook created in Netlify
- [ ] `NETLIFY_BUILD_HOOK` secret added to GitHub
- [ ] Workflow file exists: `.github/workflows/scheduled-build.yml`
- [ ] Wait for next scheduled hour
- [ ] Check GitHub Actions workflow runs
- [ ] Check Netlify Deploys tab for new builds

---

## Testing the Setup

### Test 1: Manual Workflow Run
1. Go to GitHub repo → **Actions** tab
2. Select **"Hourly Netlify Build"** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch the job complete
5. Check Netlify Deploys tab for new build

### Test 2: Manual Netlify Build (Direct)
1. Netlify Dashboard → **Deploys** tab
2. Click **Trigger deploy** → **Deploy site** (manual build)
3. Should start immediately and complete in ~1 minute

---

## Understanding the Schedule

**Cron Expression:** `0 13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5 * * *`

This means: "At minute 0 of these specific hours every day"

**UTC Hours** (for January/Winter - MST = UTC-7):
- 13:00 UTC = 6:00 AM MT
- 14:00 UTC = 7:00 AM MT
- 15:00 UTC = 8:00 AM MT
- ... (every hour through)
- 23:00 UTC = 4:00 PM MT
- 00:00 UTC = 5:00 PM MT (next day)
- 01:00 UTC = 6:00 PM MT
- ... through
- 05:00 UTC = 10:00 PM MT

**During Daylight Time (March-November):**
- MDT = UTC-6, so times shift by 1 hour
- But the cron expression stays the same
- GitHub Actions handles UTC automatically

**Total Builds:** 17 per day (roughly 1 per hour during active hours)

---

## Monitoring & Troubleshooting

### Check GitHub Workflow Status
```bash
# View recent workflow runs
# Go to: https://github.com/username/Birdworks/actions
```

### Check Netlify Build Status
```bash
# View recent deploys
# Go to: https://app.netlify.com/sites/wasatchbirdworks/deploys
```

### Common Issues

**Issue: "Webhook URL is required" in GitHub**
- Solution: Ensure `NETLIFY_BUILD_HOOK` secret is set correctly in GitHub Settings

**Issue: Workflow runs but Netlify build doesn't start**
- Check build hook URL is still valid (Netlify may have regenerated it)
- Verify secret has full URL including `https://`

**Issue: Too many/too few builds**
- Check cron expression in workflow file
- Remember: Cron times are in UTC, not local time

**Issue: Want to disable automatic builds**
- Go to GitHub → Workflow file → Comment out the `schedule:` section
- Or delete the workflow file entirely

---

## Data Freshness With This Schedule

- **Daytime (6am-10pm MT):** Data is ≤1 hour old (new build every hour)
- **Overnight (10pm-6am MT):** Data may be stale until 6am rebuild
- **All pages show timestamp:** Users can see "Data updated: [time]"

This balance maintains reasonable freshness without wasting overnight builds.

---

## Related Documentation

- **[DATA_UPDATE.md](./DATA_UPDATE.md)** - Data freshness strategy and rationale
- **[CLAUDE.md](./CLAUDE.md)** - Development commands and cache management
- **[netlify.toml](./netlify.toml)** - Netlify build configuration

---

**Last Updated:** January 12, 2026
**Workflow Version:** 1.0
