# Cron Job Setup Guide

## Issue
Vercel Hobby plan only allows 2 cron jobs, but we need automated billing tasks.

## Solution
Use external free cron service to trigger our API endpoint.

## Recommended Services (Free)

### 1. Cron-job.org (Recommended)
- **URL**: https://cron-job.org
- **Free Tier**: Unlimited jobs, 1-minute intervals
- **Setup**:
  1. Sign up at https://cron-job.org
  2. Create new cron job
  3. URL: `https://your-app.vercel.app/api/billing?action=cron`
  4. Schedule: `0 2 * * *` (Daily at 2 AM)
  5. Add custom header: `x-cron-secret: YOUR_CRON_SECRET`

### 2. EasyCron
- **URL**: https://www.easycron.com
- **Free Tier**: 100 executions/month
- **Setup**: Similar to cron-job.org

### 3. cron-job.io
- **URL**: https://cron-job.io
- **Free Tier**: Unlimited jobs
- **Setup**: Similar to cron-job.org

## Configuration

### API Endpoint
```
POST https://your-app.vercel.app/api/billing?action=cron
Headers:
  x-cron-secret: YOUR_CRON_SECRET
```

### Schedule
Run daily at 2 AM UTC: `0 2 * * *`

This single job runs all billing tasks:
- Generate monthly invoices (7 days before renewal)
- Send trial expiration reminders (7, 3, 1 day before)
- Expire overdue subscriptions

### Environment Variable
Make sure `CRON_SECRET` is set in Vercel:
```
CRON_SECRET=your_random_secret_key_here
```

## Testing

Test the cron endpoint manually:
```bash
curl -X POST \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/billing?action=cron
```

Expected response:
```json
{
  "success": true,
  "results": {
    "invoices": { "success": true, "generated": 0 },
    "reminders": { "success": true, "sent": 0 },
    "expire": { "success": true, "expired": 0 }
  }
}
```

## Alternative: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:
```yaml
name: Daily Billing Tasks
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  billing:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Billing Cron
        run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            https://your-app.vercel.app/api/billing?action=cron
```

Add `CRON_SECRET` to GitHub repository secrets.

## Monitoring

Check cron execution logs:
1. In your cron service dashboard
2. Check Vercel function logs
3. Monitor EmailLog collection in MongoDB

## Troubleshooting

**Cron not running:**
- Verify cron service is active
- Check URL is correct
- Verify `x-cron-secret` header matches

**401 Unauthorized:**
- Check `CRON_SECRET` environment variable
- Verify header name is `x-cron-secret`

**Tasks not executing:**
- Check Vercel function logs
- Verify MongoDB connection
- Check email service configuration

---

**Note**: This approach is more reliable than Vercel crons and works on free tier!
