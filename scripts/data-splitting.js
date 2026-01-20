/**
 * TASK 1: DATA SPLITTING SCRIPT
 * 
 * This script splits candidates with multiple interview rounds into separate rows.
 * Each row represents one interview round with the corresponding Calendly link.
 * 
 * Author: 2022 12027
 * Email: 202212027@dau.ac.in
 * Assignment: Weekday Founder's Office Coding Assignment
 */

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

output.markdown("# 🚀 Starting Data Splitting Process\n");
output.markdown(`Total candidates to process: **${rawRecords.records.length}**\n`);

let totalRowsCreated = 0;
let processedCandidates = 0;
let errors = [];

// Process each candidate record
for (let record of rawRecords.records) {
    try {
        // Extract candidate information
        let candidateName = record.getCellValue("Candidate Name");
        let email = record.getCellValue("Email");
        let addedOn = record.getCellValue("Added On");
        
        // Get interview rounds
        // Expected format: "Round 1, Round 2, Round 3" or "Round 1"
        let roundsField = record.getCellValue("Interview Rounds");
        let rounds = [];
        
        if (roundsField) {
            // Handle both string and array formats
            if (typeof roundsField === 'string') {
                rounds = roundsField.split(',').map(r => r.trim());
            } else if (Array.isArray(roundsField)) {
                rounds = roundsField;
            }
        }
        
        // Default to Round 1 if no rounds specified
        if (rounds.length === 0) {
            rounds = ["Round 1"];
        }
        
        // Get Calendly links
        // Expected format: "link1, link2, link3" or single link
        let calendlyField = record.getCellValue("Calendly Links");
        let calendlyLinks = [];
        
        if (calendlyField) {
            if (typeof calendlyField === 'string') {
                calendlyLinks = calendlyField.split(',').map(l => l.trim());
            } else if (Array.isArray(calendlyField)) {
                calendlyLinks = calendlyField;
            }
        }
        
        // Create a row for each interview round
        for (let i = 0; i < rounds.length; i++) {
            // Use corresponding Calendly link or fallback to first link
            let calendlyLink = calendlyLinks[i] || calendlyLinks[0] || "";
            
            // Validate round format
            let roundName = rounds[i];
            if (!roundName.toLowerCase().includes('round')) {
                roundName = `Round ${i + 1}`;
            }
            
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
        }
        
        processedCandidates++;
        output.text(`✅ Processed: ${candidateName} (${rounds.length} rounds)`);
        
    } catch (error) {
        errors.push({
            candidate: record.getCellValue("Candidate Name"),
            error: error.message
        });
        output.text(`❌ Error processing: ${record.getCellValue("Candidate Name")}`);
    }
}

// Display summary
output.markdown("\n---\n");
output.markdown("# 📊 Processing Summary\n");
output.markdown(`- **Candidates Processed:** ${processedCandidates}/${rawRecords.records.length}`);
output.markdown(`- **Total Rows Created:** ${totalRowsCreated}`);
output.markdown(`- **Success Rate:** ${((processedCandidates/rawRecords.records.length) * 100).toFixed(2)}%`);

if (errors.length > 0) {
    output.markdown("\n## ⚠️ Errors Encountered:\n");
    for (let error of errors) {
        output.markdown(`- ${error.candidate}: ${error.error}`);
    }
} else {
    output.markdown("\n✅ **All candidates processed successfully!**");
}

output.markdown("\n---\n");
output.markdown("**Next Step:** Run the email automation script to send interview invitations.");
