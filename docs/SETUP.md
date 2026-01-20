# Setup Guide

Complete step-by-step instructions for setting up the Weekday Interview Scheduling System.

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Airtable account (free tier is sufficient)
- [ ] MailerSend account with verified domain
- [ ] Basic understanding of JavaScript
- [ ] Access to the candidate CSV dataset

---

## Step 1: Airtable Setup

### 1.1 Create Airtable Account

1. Go to https://airtable.com/
2. Sign up for a free account
3. Verify your email address

### 1.2 Create New Base

1. Click "Add a base" → "Start from scratch"
2. Name it: **"Weekday Interview Scheduler"**
3. You'll start with one empty table

### 1.3 Import Raw Data

1. Rename the default table to **"Raw Candidates Data"**
2. Click the dropdown next to table name → "Import data" → "CSV file"
3. Upload the provided candidate dataset CSV
4. Map the columns appropriately:
   - Candidate Name
   - Email
   - Interview Rounds
   - Calendly Links
   - Added On (Date/Time field)

### 1.4 Create Processed Table

1. Click "+" to add a new table
2. Name it: **"Processed Candidates"**
3. Delete the default fields and create these fields:

| Field Name | Field Type | Options |
|------------|------------|---------|
| Candidate Name | Single line text | - |
| Email | Email | - |
| Interview Round | Single select | Options: Round 1, Round 2, Round 3 |
| Calendly Link | URL | - |
| Added On | Date | Include time |
| Mail Sent Time | Date | Include time |
| Email Status | Single select | Options: Pending, Sent, Failed |
| TAT | Formula | See formula below |

**TAT Formula:**
```
IF(
  {Mail Sent Time},
  DATETIME_DIFF({Mail Sent Time}, {Added On}, 'minutes') & " minutes",
  "Not sent"
)
```

---

## Step 2: MailerSend Setup

### 2.1 Create Account

1. Go to https://app.mailersend.com/
2. Sign up for a free account
3. Verify your email

### 2.2 Verify Domain

1. Go to **Settings** → **Domains**
2. Click **"Add domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider:
   - TXT record for verification
   - CNAME records for DKIM
   - MX records (optional, for receiving)
5. Wait for verification (usually 5-30 minutes)

**Don't have a domain?**
- Use MailerSend's sandbox domain for testing
- Or get a free domain from Freenom/Netlify

### 2.3 Generate API Key

1. Go to **Settings** → **API Tokens**
2. Click **"Generate new token"**
3. Name it: "Weekday Interview Automation"
4. Select scopes: **Email Send**
5. Copy the API key (you won't see it again!)
6. Store it securely

### 2.4 Create Sender Identity

1. Go to **Email** → **Sender Identities**
2. Click **"Add sender"**
3. Enter:
   - Name: "Weekday Hiring Team"
   - Email: interviews@yourdomain.com
4. Verify the sender email

---

## Step 3: Script Installation

### 3.1 Install Data Splitting Script

1. In Airtable, click **Automations** (top right)
2. Click **"Create automation"**
3. Name it: "Data Splitting"
4. **Trigger:** Manual (or schedule if preferred)
5. **Action:** Run script
6. Copy the contents of `scripts/data-splitting.js`
7. Paste into the script editor
8. Click **"Save"**

### 3.2 Install Email Automation Script

1. Create another automation: "Email Sender"
2. **Trigger:** Manual (or when record enters view)
3. **Action:** Run script
4. Copy the contents of `scripts/email-automation.js`
5. Paste into the script editor
6. **IMPORTANT:** Update these lines:
   ```javascript
   MAILERSEND_API_KEY: "YOUR_API_KEY_HERE",
   FROM_EMAIL: "interviews@yourdomain.com",
   ```
7. Click **"Save"**

---

## Step 4: Testing

### 4.1 Test Data Splitting

1. Add 2-3 test candidates to "Raw Candidates Data"
2. Include candidates with 1 round and 3 rounds
3. Run the "Data Splitting" automation
4. Verify rows are created correctly in "Processed Candidates"

**Expected Result:**
- 1-round candidate → 1 row
- 3-round candidate → 3 rows
- All data preserved correctly

### 4.2 Test Email Sending

1. **IMPORTANT:** Use your own email for testing first!
2. Update one test record's email to yours
3. Ensure Email Status = "Pending"
4. Run the "Email Sender" automation
5. Check your inbox for the email
6. Verify:
   - Email received
   - Calendly link works
   - Formatting looks good
   - Mail Sent Time updated
   - Email Status changed to "Sent"
   - TAT calculated correctly

---

## Step 5: Production Deployment

### 5.1 Import Full Dataset

1. Import complete candidate CSV to "Raw Candidates Data"
2. Verify all data imported correctly
3. Check for any missing fields

### 5.2 Run Data Splitting

1. Run "Data Splitting" automation
2. Monitor the output for errors
3. Verify total rows created matches expected count

### 5.3 Send Emails

1. **Double-check all email addresses are correct!**
2. Run "Email Sender" automation
3. Monitor progress in real-time
4. Check for any failures

### 5.4 Verify Results

1. Check "Processed Candidates" table
2. Verify all emails show "Sent" status
3. Review TAT calculations
4. Calculate average TAT

---

## Step 6: Automation (Optional)

### 6.1 Auto-Split New Candidates

1. Edit "Data Splitting" automation
2. Change trigger to: **"When record created"** in Raw table
3. This will auto-split new candidates

### 6.2 Auto-Send Emails

1. Create a view in "Processed Candidates": **"Pending Emails"**
2. Filter: Email Status = "Pending"
3. Edit "Email Sender" automation
4. Change trigger to: **"When record enters view"** → "Pending Emails"
5. This will auto-send emails to new pending candidates

---

## Troubleshooting

### Common Issues

**Issue:** "API key invalid"
- **Solution:** Regenerate API key in MailerSend, update script

**Issue:** "Domain not verified"
- **Solution:** Check DNS records, wait for propagation

**Issue:** "Email not sending"
- **Solution:** Check sender email is verified, check API quota

**Issue:** "TAT showing wrong time"
- **Solution:** Verify timezone settings in Airtable

**Issue:** "Script timeout"
- **Solution:** Process in smaller batches, add delays

---

## Best Practices

1. **Always test with your own email first**
2. **Keep API keys secure** (never commit to Git)
3. **Monitor email delivery rates**
4. **Set up error notifications**
5. **Backup your data regularly**
6. **Use rate limiting** to avoid API throttling
7. **Log all operations** for debugging

---

## Support

If you encounter issues:

1. Check the [API Documentation](API_DOCUMENTATION.md)
2. Review [Testing Guide](TESTING.md)
3. Check MailerSend status page
4. Review Airtable automation logs

---

## Next Steps

After successful setup:

1. Monitor TAT metrics
2. Optimize email templates
3. Set up analytics tracking
4. Create reporting dashboards
5. Implement A/B testing

---

**Setup Complete!** 🎉

Your automated interview scheduling system is now ready to use.
