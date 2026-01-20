/**
 * TASK 2: EMAIL AUTOMATION SCRIPT (ENHANCED VERSION)
 * 
 * This script sends automated interview invitation emails to candidates
 * using the MailerSend API. Each email includes the appropriate Calendly link
 * for the candidate's scheduled round.
 * 
 * ENHANCEMENTS:
 * - Retry logic with exponential backoff
 * - Email validation
 * - Enhanced error logging
 * - Rate limit handling
 * 
 * Author: 2022 12027
 * Email: 202212027@dau.ac.in
 * Assignment: Weekday Founder's Office Coding Assignment
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const CONFIG = {
    // Get your API key from: https://app.mailersend.com/settings/api-keys
    MAILERSEND_API_KEY: "YOUR_MAILERSEND_API_KEY_HERE",
    
    // Your verified sender email (must be verified in MailerSend)
    FROM_EMAIL: "interviews@yourdomain.com",
    FROM_NAME: "Weekday Hiring Team",
    
    // Rate limiting (milliseconds between emails)
    RATE_LIMIT_MS: 1000, // 1 second between emails
    
    // Batch size (process this many at a time)
    BATCH_SIZE: 10,
    
    // Retry configuration
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY: 1000 // 1 second, will increase exponentially
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// EMAIL TEMPLATE
// ============================================

function generateEmailHTML(candidateName, round, calendlyLink) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .cta-button {
            display: inline-block;
            background-color: #4CAF50;
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .cta-button:hover {
            background-color: #45a049;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .round-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Interview Invitation</h1>
        <p>Weekday (YC W21)</p>
    </div>
    
    <div class="content">
        <h2>Hi ${candidateName},</h2>
        
        <p>Congratulations! 🎊 You've been shortlisted for <span class="round-badge">${round}</span> at Weekday.</p>
        
        <p>We're excited to learn more about you and discuss how you can contribute to our mission of revolutionizing the hiring process.</p>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
            <li>Click the button below to schedule your interview</li>
            <li>Choose a time slot that works best for you</li>
            <li>You'll receive a calendar invitation with meeting details</li>
        </ol>
        
        <div style="text-align: center;">
            <a href="${calendlyLink}" class="cta-button">📅 Schedule Your Interview</a>
        </div>
        
        <p><strong>What to expect:</strong></p>
        <ul>
            <li>Duration: 30-45 minutes</li>
            <li>Format: Video call (link will be sent after scheduling)</li>
            <li>Focus: Your experience, skills, and cultural fit</li>
        </ul>
        
        <p>If you have any questions or need to reschedule, please don't hesitate to reach out.</p>
        
        <p>Looking forward to speaking with you!</p>
        
        <p>Best regards,<br>
        <strong>The Weekday Team</strong><br>
        <em>Building the future of hiring</em></p>
    </div>
    
    <div class="footer">
        <p>Weekday (YC W21) | Y-Combinator Backed</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
</body>
</html>
    `;
}

// ============================================
// EMAIL SENDING WITH RETRY LOGIC
// ============================================

/**
 * Send email with retry logic and exponential backoff
 * @param {Object} emailData - Email data to send
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Object} - Result object with success status
 */
async function sendEmailWithRetry(emailData, maxRetries = CONFIG.MAX_RETRIES) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            output.text(`  Attempt ${attempt}/${maxRetries}...`);
            
            let response = await fetch("https://api.mailersend.com/v1/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.MAILERSEND_API_KEY}`
                },
                body: JSON.stringify(emailData)
            });
            
            // Success
            if (response.status === 202) {
                return { 
                    success: true, 
                    attempt: attempt,
                    status: response.status 
                };
            }
            
            // Rate limited - wait and retry
            if (response.status === 429) {
                if (attempt < maxRetries) {
                    let retryDelay = CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                    output.text(`  ⏳ Rate limited. Waiting ${retryDelay}ms before retry...`);
                    await sleep(retryDelay);
                    continue;
                }
            }
            
            // Other error
            let errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
            
        } catch (error) {
            lastError = error;
            
            // If this is not the last attempt, wait and retry
            if (attempt < maxRetries) {
                let retryDelay = CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                output.text(`  ⚠️ Error: ${error.message}. Retrying in ${retryDelay}ms...`);
                await sleep(retryDelay);
            }
        }
    }
    
    // All retries failed
    return { 
        success: false, 
        error: lastError?.message || "Unknown error",
        attempts: maxRetries 
    };
}

// ============================================
// MAIN SCRIPT
// ============================================

async function sendInterviewEmails() {
    output.markdown("# 📧 Starting Email Automation (Enhanced Version)\n");
    
    // Validate configuration
    if (CONFIG.MAILERSEND_API_KEY === "YOUR_MAILERSEND_API_KEY_HERE") {
        output.markdown("## ❌ ERROR: Please update the MAILERSEND_API_KEY in the script!\n");
        return;
    }
    
    if (!isValidEmail(CONFIG.FROM_EMAIL)) {
        output.markdown("## ❌ ERROR: FROM_EMAIL is not a valid email address!\n");
        return;
    }
    
    // Get the processed candidates table
    let table = base.getTable("Processed Candidates");
    
    // Fetch records with "Pending" status
    let query = await table.selectRecordsAsync({
        fields: [
            "Candidate Name",
            "Email",
            "Interview Round",
            "Calendly Link",
            "Email Status"
        ]
    });
    
    // Filter for pending emails
    let pendingRecords = query.records.filter(record => {
        let status = record.getCellValue("Email Status");
        return status && status.name === "Pending";
    });
    
    output.markdown(`Found **${pendingRecords.length}** pending emails to send\n`);
    
    if (pendingRecords.length === 0) {
        output.markdown("✅ No pending emails. All done!");
        return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    let errors = [];
    
    // Process records
    for (let i = 0; i < pendingRecords.length; i++) {
        let record = pendingRecords[i];
        let startTime = Date.now();
        
        try {
            // Extract candidate information
            let candidateName = record.getCellValue("Candidate Name") || "Candidate";
            let candidateEmail = record.getCellValue("Email");
            let round = record.getCellValue("Interview Round")?.name || "Round 1";
            let calendlyLink = record.getCellValue("Calendly Link");
            
            output.text(`\n[${i + 1}/${pendingRecords.length}] Processing: ${candidateName} (${candidateEmail})`);
            
            // Validate email address
            if (!isValidEmail(candidateEmail)) {
                throw new Error("Invalid email address format");
            }
            
            // Validate Calendly link
            if (!calendlyLink) {
                output.text(`  ⚠️ Warning: No Calendly link provided. Skipping...`);
                skippedCount++;
                
                await table.updateRecordAsync(record.id, {
                    "Email Status": { name: "Failed" }
                });
                
                errors.push({
                    candidate: candidateName,
                    email: candidateEmail,
                    error: "Missing Calendly link",
                    timestamp: new Date().toISOString(),
                    errorType: "ValidationError"
                });
                
                continue;
            }
            
            if (!isValidURL(calendlyLink)) {
                output.text(`  ⚠️ Warning: Invalid Calendly URL format`);
            }
            
            // Generate email content
            let emailHTML = generateEmailHTML(candidateName, round, calendlyLink);
            let emailSubject = `Interview Invitation - ${round} at Weekday`;
            
            // Prepare email data
            let emailData = {
                from: {
                    email: CONFIG.FROM_EMAIL,
                    name: CONFIG.FROM_NAME
                },
                to: [{
                    email: candidateEmail,
                    name: candidateName
                }],
                subject: emailSubject,
                html: emailHTML
            };
            
            // Send email with retry logic
            let result = await sendEmailWithRetry(emailData);
            
            if (result.success) {
                // Email sent successfully
                let currentTime = new Date().toISOString();
                let duration = Date.now() - startTime;
                
                await table.updateRecordAsync(record.id, {
                    "Mail Sent Time": currentTime,
                    "Email Status": { name: "Sent" }
                });
                
                successCount++;
                output.text(`  ✅ Success! (${duration}ms, attempt ${result.attempt})`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            // Email failed
            failureCount++;
            let duration = Date.now() - startTime;
            
            errors.push({
                candidate: record.getCellValue("Candidate Name") || "Unknown",
                email: record.getCellValue("Email") || "Unknown",
                error: error.message,
                timestamp: new Date().toISOString(),
                errorType: error.name || "Error",
                duration: duration
            });
            
            await table.updateRecordAsync(record.id, {
                "Email Status": { name: "Failed" }
            });
            
            output.text(`  ❌ Failed: ${error.message} (${duration}ms)`);
        }
        
        // Rate limiting - wait before next email
        if (i < pendingRecords.length - 1) {
            await sleep(CONFIG.RATE_LIMIT_MS);
        }
    }
    
    // Display summary
    output.markdown("\n---\n");
    output.markdown("# 📊 Email Sending Summary\n");
    output.markdown(`- **Total Emails:** ${pendingRecords.length}`);
    output.markdown(`- **Successfully Sent:** ${successCount} ✅`);
    output.markdown(`- **Failed:** ${failureCount} ❌`);
    output.markdown(`- **Skipped:** ${skippedCount} ⚠️`);
    output.markdown(`- **Success Rate:** ${((successCount/pendingRecords.length) * 100).toFixed(2)}%`);
    
    if (errors.length > 0) {
        output.markdown("\n## ⚠️ Failed/Skipped Emails:\n");
        for (let error of errors) {
            output.markdown(`- **${error.candidate}** (${error.email})`);
            output.markdown(`  - Error: ${error.error}`);
            output.markdown(`  - Type: ${error.errorType}`);
            output.markdown(`  - Time: ${error.timestamp}`);
        }
    }
    
    output.markdown("\n---\n");
    output.markdown("✅ **Email automation completed!**");
    output.markdown("\n**Next Step:** Check the TAT field in Airtable to see turnaround times.");
}

// Run the script
await sendInterviewEmails();
