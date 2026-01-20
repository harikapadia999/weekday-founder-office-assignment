# API Documentation

Complete reference for the MailerSend API integration used in this project.

---

## MailerSend API Overview

**Base URL:** `https://api.mailersend.com/v1`  
**Authentication:** Bearer Token (API Key)  
**Rate Limits:** 
- Free tier: 3,000 emails/month
- Pro tier: Custom limits

---

## Authentication

All API requests require authentication via Bearer token in the header:

```javascript
headers: {
    "Authorization": "Bearer YOUR_API_KEY_HERE"
}
```

### Getting Your API Key

1. Log in to MailerSend dashboard
2. Navigate to **Settings** → **API Tokens**
3. Click **"Generate new token"**
4. Select required scopes
5. Copy and store securely

---

## Send Email Endpoint

### Endpoint
```
POST /v1/email
```

### Headers
```javascript
{
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
```

### Request Body

```javascript
{
    "from": {
        "email": "sender@yourdomain.com",
        "name": "Sender Name"
    },
    "to": [
        {
            "email": "recipient@example.com",
            "name": "Recipient Name"
        }
    ],
    "subject": "Email Subject",
    "html": "<h1>HTML Content</h1>",
    "text": "Plain text content (optional)"
}
```

### Response

**Success (202 Accepted):**
```javascript
{
    "message": "Email queued for delivery"
}
```

**Error (4xx/5xx):**
```javascript
{
    "message": "Error description",
    "errors": {
        "field": ["Error details"]
    }
}
```

---

## Complete Example

### JavaScript (Airtable Script)

```javascript
async function sendEmail(to, subject, htmlContent) {
    const API_KEY = "your_api_key_here";
    const FROM_EMAIL = "interviews@yourdomain.com";
    
    try {
        let response = await fetch("https://api.mailersend.com/v1/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                from: {
                    email: FROM_EMAIL,
                    name: "Weekday Hiring Team"
                },
                to: [{
                    email: to.email,
                    name: to.name
                }],
                subject: subject,
                html: htmlContent
            })
        });
        
        if (response.status === 202) {
            return { success: true };
        } else {
            let error = await response.json();
            return { success: false, error: error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Usage
let result = await sendEmail(
    { email: "candidate@example.com", name: "John Doe" },
    "Interview Invitation - Round 1",
    "<h1>Your interview invitation...</h1>"
);
```

---

## Advanced Features

### 1. Email Templates

Use pre-built templates instead of HTML:

```javascript
{
    "from": {...},
    "to": [...],
    "template_id": "your_template_id",
    "variables": [
        {
            "email": "recipient@example.com",
            "substitutions": [
                {
                    "var": "candidate_name",
                    "value": "John Doe"
                },
                {
                    "var": "interview_round",
                    "value": "Round 1"
                }
            ]
        }
    ]
}
```

### 2. Attachments

```javascript
{
    "from": {...},
    "to": [...],
    "subject": "...",
    "html": "...",
    "attachments": [
        {
            "content": "base64_encoded_content",
            "filename": "document.pdf",
            "type": "application/pdf"
        }
    ]
}
```

### 3. CC and BCC

```javascript
{
    "from": {...},
    "to": [...],
    "cc": [
        {
            "email": "cc@example.com",
            "name": "CC Recipient"
        }
    ],
    "bcc": [
        {
            "email": "bcc@example.com",
            "name": "BCC Recipient"
        }
    ],
    "subject": "...",
    "html": "..."
}
```

### 4. Reply-To

```javascript
{
    "from": {...},
    "to": [...],
    "reply_to": {
        "email": "replies@yourdomain.com",
        "name": "Reply Handler"
    },
    "subject": "...",
    "html": "..."
}
```

### 5. Custom Headers

```javascript
{
    "from": {...},
    "to": [...],
    "subject": "...",
    "html": "...",
    "headers": {
        "X-Custom-Header": "value",
        "X-Message-ID": "unique-id-123"
    }
}
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify domain/sender |
| 422 | Validation Error | Check request format |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry later |

### Error Response Example

```javascript
{
    "message": "The given data was invalid.",
    "errors": {
        "to.0.email": [
            "The to.0.email must be a valid email address."
        ]
    }
}
```

### Handling in Code

```javascript
try {
    let response = await fetch(...);
    
    if (response.status === 202) {
        // Success
        return { success: true };
    } else if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(r => setTimeout(r, 5000));
        return await sendEmail(...); // Retry
    } else {
        // Other error
        let error = await response.json();
        console.error("Email failed:", error);
        return { success: false, error };
    }
} catch (error) {
    // Network error
    console.error("Network error:", error);
    return { success: false, error: error.message };
}
```

---

## Rate Limiting

### Best Practices

1. **Implement delays between requests:**
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
   ```

2. **Batch processing:**
   ```javascript
   const BATCH_SIZE = 10;
   for (let i = 0; i < records.length; i += BATCH_SIZE) {
       let batch = records.slice(i, i + BATCH_SIZE);
       await processBatch(batch);
       await new Promise(r => setTimeout(r, 5000)); // 5 sec between batches
   }
   ```

3. **Exponential backoff:**
   ```javascript
   async function sendWithRetry(data, maxRetries = 3) {
       for (let i = 0; i < maxRetries; i++) {
           let result = await sendEmail(data);
           if (result.success) return result;
           
           // Wait longer each retry: 1s, 2s, 4s
           await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
       }
       return { success: false, error: "Max retries exceeded" };
   }
   ```

---

## Webhooks (Optional)

Track email events (opens, clicks, bounces):

### Setup

1. Go to MailerSend dashboard → **Webhooks**
2. Add webhook URL
3. Select events to track
4. Save webhook

### Events Available

- `email.sent` - Email sent successfully
- `email.delivered` - Email delivered to inbox
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked link
- `email.bounced` - Email bounced
- `email.spam_complaint` - Marked as spam

### Webhook Payload Example

```javascript
{
    "type": "email.opened",
    "data": {
        "email": {
            "message_id": "abc123",
            "recipient": "candidate@example.com",
            "subject": "Interview Invitation",
            "opened_at": "2024-01-15T10:30:00Z"
        }
    }
}
```

---

## Testing

### Test Mode

MailerSend provides a sandbox for testing:

```javascript
// Use sandbox domain for testing
const FROM_EMAIL = "test@trial-123.mailersend.net";
```

### Verify Email Delivery

1. Check MailerSend dashboard → **Activity**
2. View email status (queued, sent, delivered, failed)
3. See detailed logs

---

## Monitoring & Analytics

### Dashboard Metrics

- Total emails sent
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam complaints

### API Analytics Endpoint

```javascript
GET /v1/analytics/date
```

Query parameters:
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)
- `domain_id` - Filter by domain

---

## Security Best Practices

1. **Never expose API keys in code**
   - Use environment variables
   - Store in Airtable script settings
   - Rotate keys regularly

2. **Validate email addresses**
   ```javascript
   function isValidEmail(email) {
       return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   }
   ```

3. **Sanitize HTML content**
   - Escape user input
   - Use templates when possible

4. **Implement rate limiting**
   - Prevent abuse
   - Stay within quotas

---

## Resources

- [Official MailerSend Docs](https://developers.mailersend.com/)
- [API Reference](https://developers.mailersend.com/api/v1/email.html)
- [Status Page](https://status.mailersend.com/)
- [Support](https://www.mailersend.com/help)

---

## Appendix: Full Request Example

```javascript
const emailRequest = {
    from: {
        email: "interviews@weekday.com",
        name: "Weekday Hiring Team"
    },
    to: [
        {
            email: "john.doe@example.com",
            name: "John Doe"
        }
    ],
    reply_to: {
        email: "hiring@weekday.com",
        name: "Hiring Team"
    },
    subject: "Interview Invitation - Round 1 at Weekday",
    html: `
        <h1>Hi John,</h1>
        <p>You've been selected for Round 1...</p>
        <a href="https://calendly.com/weekday/round1">Schedule Interview</a>
    `,
    text: "Hi John, You've been selected for Round 1...",
    tags: ["interview", "round1"],
    headers: {
        "X-Campaign": "Interview-Invitations-2024"
    }
};

// Send request
let response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer mlsn.abc123..."
    },
    body: JSON.stringify(emailRequest)
});
```

---

**Last Updated:** January 2026
