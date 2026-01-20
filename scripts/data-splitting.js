/**
 * TASK 1: DATA SPLITTING SCRIPT (ENHANCED VERSION)
 * 
 * This script splits candidates with multiple interview rounds into separate rows.
 * Each row represents one interview round with the corresponding Calendly link.
 * 
 * ENHANCEMENTS:
 * - Email validation
 * - URL validation
 * - Data sanitization
 * - Enhanced error logging
 * - Better progress tracking
 * 
 * Author: 2022 12027
 * Email: 202212027@dau.ac.in
 * Assignment: Weekday Founder's Office Coding Assignment
 */

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
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (error) {
        return false;
    }
}

/**
 * Sanitizes text input by trimming whitespace
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text.trim();
}

/**
 * Validates round name format
 * @param {string} roundName - Round name to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidRoundName(roundName) {
    if (!roundName || typeof roundName !== 'string') {
        return false;
    }
    
    // Check if it contains "round" (case insensitive) or is a number
    return /round/i.test(roundName) || /^\d+$/.test(roundName);
}

// ============================================
// MAIN SCRIPT
// ============================================

// Get references to both tables
let rawTable = base.getTable("Raw Candidates Data");
let processedTable = base.getTable("Processed Candidates");

// Fetch all records from raw data table
let rawRecords = await rawTable.selectRecordsAsync({
    fields: [
        "Candidate Name",
        "Email",
        "Interview Rounds",
        "Calendly Links",
        "Added On"
    ]
});

output.markdown("# 🚀 Starting Data Splitting Process (Enhanced Version)\n");
output.markdown(`Total candidates to process: **${rawRecords.records.length}**\n`);

let totalRowsCreated = 0;
let processedCandidates = 0;
let skippedCandidates = 0;
let errors = [];
let warnings = [];

// Process each candidate record
for (let i = 0; i < rawRecords.records.length; i++) {
    let record = rawRecords.records[i];
    let startTime = Date.now();
    
    try {
        // Extract candidate information
        let candidateName = sanitizeText(record.getCellValue("Candidate Name"));
        let email = sanitizeText(record.getCellValue("Email"));
        let addedOn = record.getCellValue("Added On");
        
        output.text(`\n[${i + 1}/${rawRecords.records.length}] Processing: ${candidateName || 'Unknown'}`);
        
        // Validate required fields
        if (!candidateName) {
            throw new Error("Missing candidate name");
        }
        
        if (!email) {
            throw new Error("Missing email address");
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            warnings.push({
                candidate: candidateName,
                email: email,
                warning: "Invalid email format",
                timestamp: new Date().toISOString()
            });
            output.text(`  ⚠️ Warning: Invalid email format for ${email}`);
        }
        
        if (!addedOn) {
            warnings.push({
                candidate: candidateName,
                email: email,
                warning: "Missing 'Added On' timestamp",
                timestamp: new Date().toISOString()
            });
            output.text(`  ⚠️ Warning: Missing 'Added On' timestamp`);
            addedOn = new Date().toISOString(); // Use current time as fallback
        }
        
        // Get interview rounds
        // Expected format: "Round 1, Round 2, Round 3" or "Round 1"
        let roundsField = record.getCellValue("Interview Rounds");
        let rounds = [];
        
        if (roundsField) {
            // Handle both string and array formats
            if (typeof roundsField === 'string') {
                rounds = roundsField.split(',').map(r => sanitizeText(r));
            } else if (Array.isArray(roundsField)) {
                rounds = roundsField.map(r => sanitizeText(r));
            }
            
            // Filter out empty rounds
            rounds = rounds.filter(r => r.length > 0);
        }
        
        // Default to Round 1 if no rounds specified
        if (rounds.length === 0) {
            rounds = ["Round 1"];
            output.text(`  ℹ️ No rounds specified, defaulting to Round 1`);
        }
        
        // Get Calendly links
        // Expected format: "link1, link2, link3" or single link
        let calendlyField = record.getCellValue("Calendly Links");
        let calendlyLinks = [];
        
        if (calendlyField) {
            if (typeof calendlyField === 'string') {
                calendlyLinks = calendlyField.split(',').map(l => sanitizeText(l));
            } else if (Array.isArray(calendlyField)) {
                calendlyLinks = calendlyField.map(l => sanitizeText(l));
            }
            
            // Filter out empty links
            calendlyLinks = calendlyLinks.filter(l => l.length > 0);
            
            // Validate URLs
            for (let link of calendlyLinks) {
                if (!isValidURL(link)) {
                    warnings.push({
                        candidate: candidateName,
                        email: email,
                        warning: `Invalid Calendly URL: ${link}`,
                        timestamp: new Date().toISOString()
                    });
                    output.text(`  ⚠️ Warning: Invalid URL format for ${link}`);
                }
            }
        }
        
        if (calendlyLinks.length === 0) {
            warnings.push({
                candidate: candidateName,
                email: email,
                warning: "No Calendly links provided",
                timestamp: new Date().toISOString()
            });
            output.text(`  ⚠️ Warning: No Calendly links provided`);
        }
        
        // Create a row for each interview round
        let rowsCreatedForCandidate = 0;
        
        for (let j = 0; j < rounds.length; j++) {
            // Use corresponding Calendly link or fallback to first link
            let calendlyLink = calendlyLinks[j] || calendlyLinks[0] || "";
            
            // Validate and normalize round format
            let roundName = rounds[j];
            
            if (!isValidRoundName(roundName)) {
                output.text(`  ℹ️ Normalizing round name: "${roundName}" -> "Round ${j + 1}"`);
                roundName = `Round ${j + 1}`;
            } else if (!roundName.toLowerCase().includes('round')) {
                roundName = `Round ${roundName}`;
            }
            
            // Ensure proper capitalization
            roundName = roundName.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            
            // Create new record in processed table
            await processedTable.createRecordAsync({
                "Candidate Name": candidateName,
                "Email": email,
                "Interview Round": { name: roundName },
                "Calendly Link": calendlyLink,
                "Added On": addedOn,
                "Email Status": { name: "Pending" }
            });
            
            totalRowsCreated++;
            rowsCreatedForCandidate++;
        }
        
        processedCandidates++;
        let duration = Date.now() - startTime;
        output.text(`  ✅ Created ${rowsCreatedForCandidate} row(s) (${duration}ms)`);
        
    } catch (error) {
        skippedCandidates++;
        let duration = Date.now() - startTime;
        
        errors.push({
            candidate: record.getCellValue("Candidate Name") || "Unknown",
            email: record.getCellValue("Email") || "Unknown",
            error: error.message,
            timestamp: new Date().toISOString(),
            errorType: error.name || "Error",
            duration: duration
        });
        
        output.text(`  ❌ Error: ${error.message} (${duration}ms)`);
    }
}

// Display summary
output.markdown("\n---\n");
output.markdown("# 📊 Processing Summary\n");
output.markdown(`- **Total Candidates:** ${rawRecords.records.length}`);
output.markdown(`- **Successfully Processed:** ${processedCandidates} ✅`);
output.markdown(`- **Skipped (Errors):** ${skippedCandidates} ❌`);
output.markdown(`- **Total Rows Created:** ${totalRowsCreated}`);
output.markdown(`- **Success Rate:** ${((processedCandidates/rawRecords.records.length) * 100).toFixed(2)}%`);

if (warnings.length > 0) {
    output.markdown(`\n## ⚠️ Warnings (${warnings.length}):\n`);
    
    // Group warnings by type
    let warningsByType = {};
    for (let warning of warnings) {
        if (!warningsByType[warning.warning]) {
            warningsByType[warning.warning] = [];
        }
        warningsByType[warning.warning].push(warning);
    }
    
    for (let [warningType, items] of Object.entries(warningsByType)) {
        output.markdown(`\n### ${warningType} (${items.length} occurrences)`);
        for (let item of items.slice(0, 5)) { // Show first 5
            output.markdown(`- **${item.candidate}** (${item.email})`);
        }
        if (items.length > 5) {
            output.markdown(`- ... and ${items.length - 5} more`);
        }
    }
}

if (errors.length > 0) {
    output.markdown(`\n## ❌ Errors Encountered (${errors.length}):\n`);
    for (let error of errors) {
        output.markdown(`- **${error.candidate}** (${error.email})`);
        output.markdown(`  - Error: ${error.error}`);
        output.markdown(`  - Type: ${error.errorType}`);
        output.markdown(`  - Time: ${error.timestamp}`);
    }
} else {
    output.markdown("\n✅ **All candidates processed successfully with no errors!**");
}

output.markdown("\n---\n");
output.markdown("**Next Step:** Run the email automation script to send interview invitations.");

// Performance metrics
if (totalRowsCreated > 0) {
    output.markdown("\n### 📈 Performance Metrics");
    output.markdown(`- Average rows per candidate: ${(totalRowsCreated / processedCandidates).toFixed(2)}`);
    output.markdown(`- Data quality score: ${(((processedCandidates - warnings.length) / processedCandidates) * 100).toFixed(2)}%`);
}
