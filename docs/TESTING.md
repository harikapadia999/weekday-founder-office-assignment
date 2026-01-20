# Testing Guide

Comprehensive testing procedures for the Weekday Interview Scheduling System.

---

## Testing Overview

This guide covers:
1. Unit testing individual components
2. Integration testing the full workflow
3. Edge case handling
4. Performance testing
5. User acceptance testing

---

## Pre-Testing Checklist

Before running tests, ensure:

- [ ] Airtable base is set up correctly
- [ ] MailerSend API key is configured
- [ ] Domain is verified in MailerSend
- [ ] Test data is prepared
- [ ] Scripts are installed in Airtable

---

## Test Data Preparation

### Sample Test Dataset

Create a CSV with these test cases:

```csv
Candidate Name,Email,Interview Rounds,Calendly Links,Added On
John Doe,your-email+john@gmail.com,"Round 1",https://calendly.com/test/round1,2024-01-15 10:00:00
Jane Smith,your-email+jane@gmail.com,"Round 1, Round 2","https://calendly.com/test/round1, https://calendly.com/test/round2",2024-01-15 10:05:00
Bob Johnson,your-email+bob@gmail.com,"Round 1, Round 2, Round 3","https://calendly.com/test/round1, https://calendly.com/test/round2, https://calendly.com/test/round3",2024-01-15 10:10:00
Alice Williams,invalid-email,"Round 1",https://calendly.com/test/round1,2024-01-15 10:15:00
Charlie Brown,your-email+charlie@gmail.com,"Round 1",,2024-01-15 10:20:00
```

**Note:** Use Gmail's `+` trick to test multiple candidates with one inbox!

---

## Test 1: Data Splitting

### Objective
Verify that candidates with multiple rounds are split correctly.

### Test Cases

#### TC1.1: Single Round Candidate
**Input:** 1 candidate with "Round 1"  
**Expected:** 1 row created in Processed table  
**Verification:**
- [ ] Candidate name matches
- [ ] Email matches
- [ ] Round = "Round 1"
- [ ] Calendly link preserved
- [ ] Added On timestamp preserved
- [ ] Email Status = "Pending"

#### TC1.2: Multi-Round Candidate (2 rounds)
**Input:** 1 candidate with "Round 1, Round 2"  
**Expected:** 2 rows created  
**Verification:**
- [ ] Row 1: Round 1 with link 1
- [ ] Row 2: Round 2 with link 2
- [ ] Both rows have same candidate info
- [ ] Both have Email Status = "Pending"

#### TC1.3: Multi-Round Candidate (3 rounds)
**Input:** 1 candidate with "Round 1, Round 2, Round 3"  
**Expected:** 3 rows created  
**Verification:**
- [ ] All 3 rounds created correctly
- [ ] Each has corresponding Calendly link
- [ ] All other data preserved

#### TC1.4: Missing Calendly Links
**Input:** Candidate with rounds but no links  
**Expected:** Rows created with empty Calendly field  
**Verification:**
- [ ] Script doesn't crash
- [ ] Rows created successfully
- [ ] Calendly Link field is empty

### Running the Test

```javascript
// In Airtable Scripts
let rawTable = base.getTable("Raw Candidates Data");
let processedTable = base.getTable("Processed Candidates");

// Count before
let beforeCount = (await processedTable.selectRecordsAsync()).records.length;

// Run data splitting script
// ... (run your script)

// Count after
let afterCount = (await processedTable.selectRecordsAsync()).records.length;

output.text(`Rows created: ${afterCount - beforeCount}`);
```

### Success Criteria
- ✅ All test cases pass
- ✅ No errors in console
- ✅ Row count matches expected
- ✅ Data integrity maintained

---

## Test 2: Email Automation

### Objective
Verify emails are sent correctly with proper content and tracking.

### Test Cases

#### TC2.1: Valid Email Send
**Input:** Pending record with valid email  
**Expected:** Email sent successfully  
**Verification:**
- [ ] Email received in inbox
- [ ] Subject line correct
- [ ] Candidate name personalized
- [ ] Round information correct
- [ ] Calendly link clickable
- [ ] HTML formatting renders properly
- [ ] Mail Sent Time updated
- [ ] Email Status = "Sent"

#### TC2.2: Invalid Email Address
**Input:** Pending record with invalid email  
**Expected:** Email fails gracefully  
**Verification:**
- [ ] Script doesn't crash
- [ ] Email Status = "Failed"
- [ ] Error logged
- [ ] Other emails continue processing

#### TC2.3: Missing Calendly Link
**Input:** Pending record without Calendly link  
**Expected:** Email sent with empty/placeholder link  
**Verification:**
- [ ] Email still sends
- [ ] Missing link handled gracefully
- [ ] Status updated appropriately

#### TC2.4: Batch Processing
**Input:** 10 pending records  
**Expected:** All emails sent with rate limiting  
**Verification:**
- [ ] All 10 emails sent
- [ ] Rate limiting applied (1 sec between)
- [ ] Total time ≈ 10 seconds
- [ ] All statuses updated

### Running the Test

1. **Set up test emails:**
   ```
   Use your-email+test1@gmail.com
   Use your-email+test2@gmail.com
   etc.
   ```

2. **Run email script**

3. **Check inbox:**
   - All emails received?
   - Correct content?
   - Links work?

4. **Check Airtable:**
   - All statuses updated?
   - Timestamps recorded?

### Success Criteria
- ✅ 100% delivery for valid emails
- ✅ Graceful failure handling
- ✅ Proper status tracking
- ✅ Rate limiting working

---

## Test 3: TAT Calculation

### Objective
Verify turnaround time is calculated accurately.

### Test Cases

#### TC3.1: Immediate Send
**Setup:** Added On = 10:00:00, Mail Sent = 10:00:30  
**Expected TAT:** "0 minutes" or "30 seconds"  
**Verification:**
- [ ] TAT formula calculates correctly
- [ ] Display format is readable

#### TC3.2: Delayed Send
**Setup:** Added On = 10:00:00, Mail Sent = 10:05:00  
**Expected TAT:** "5 minutes"  
**Verification:**
- [ ] TAT = 5 minutes
- [ ] Calculation accurate

#### TC3.3: Not Sent Yet
**Setup:** Added On = 10:00:00, Mail Sent = (empty)  
**Expected TAT:** "Not sent" or similar  
**Verification:**
- [ ] Formula handles null gracefully
- [ ] Shows appropriate message

### Running the Test

```javascript
// Check TAT calculations
let table = base.getTable("Processed Candidates");
let records = await table.selectRecordsAsync({
    fields: ["Candidate Name", "Added On", "Mail Sent Time", "TAT"]
});

for (let record of records.records) {
    let addedOn = record.getCellValue("Added On");
    let sentTime = record.getCellValue("Mail Sent Time");
    let tat = record.getCellValue("TAT");
    
    output.text(`${record.getCellValue("Candidate Name")}: ${tat}`);
}
```

### Success Criteria
- ✅ All TAT values accurate
- ✅ Formula handles edge cases
- ✅ Display format clear

---

## Test 4: Edge Cases

### TC4.1: Empty Dataset
**Input:** No records in Raw table  
**Expected:** Script completes without errors  
**Result:** ___

### TC4.2: Duplicate Candidates
**Input:** Same candidate appears twice  
**Expected:** Both processed independently  
**Result:** ___

### TC4.3: Special Characters in Name
**Input:** Name with é, ñ, 中文, etc.  
**Expected:** Handled correctly in email  
**Result:** ___

### TC4.4: Very Long Calendly URL
**Input:** URL > 500 characters  
**Expected:** Stored and sent correctly  
**Result:** ___

### TC4.5: API Rate Limit Hit
**Input:** Send 100 emails rapidly  
**Expected:** Graceful handling, retry logic  
**Result:** ___

---

## Test 5: Integration Testing

### Full Workflow Test

**Scenario:** Complete end-to-end flow

1. **Import Data**
   - [ ] CSV imports successfully
   - [ ] All fields mapped correctly

2. **Split Data**
   - [ ] Script runs without errors
   - [ ] Correct number of rows created
   - [ ] Data integrity maintained

3. **Send Emails**
   - [ ] All emails sent
   - [ ] Proper rate limiting
   - [ ] Status tracking works

4. **Calculate TAT**
   - [ ] All TATs calculated
   - [ ] Values are reasonable
   - [ ] Average TAT < 10 minutes

5. **Verify Results**
   - [ ] All emails received
   - [ ] Links work
   - [ ] Formatting correct

### Success Criteria
- ✅ Complete workflow executes smoothly
- ✅ No manual intervention needed
- ✅ All data tracked properly

---

## Test 6: Performance Testing

### Objective
Ensure system handles large datasets efficiently.

### Test Cases

#### TC6.1: 100 Candidates
**Input:** 100 candidates (mix of 1-3 rounds)  
**Expected:**
- Data splitting: < 2 minutes
- Email sending: < 3 minutes (with rate limiting)
- No errors

#### TC6.2: 500 Candidates
**Input:** 500 candidates  
**Expected:**
- Data splitting: < 5 minutes
- Email sending: < 10 minutes
- Memory usage acceptable

### Metrics to Track

```javascript
// Performance monitoring
let startTime = Date.now();

// ... run script ...

let endTime = Date.now();
let duration = (endTime - startTime) / 1000;

output.text(`Execution time: ${duration} seconds`);
output.text(`Records processed: ${recordCount}`);
output.text(`Rate: ${(recordCount / duration).toFixed(2)} records/sec`);
```

---

## Test 7: Error Handling

### Scenarios to Test

1. **Network Failure**
   - Disconnect internet mid-send
   - Expected: Graceful failure, retry logic

2. **Invalid API Key**
   - Use wrong API key
   - Expected: Clear error message

3. **Quota Exceeded**
   - Hit MailerSend limit
   - Expected: Proper error handling

4. **Malformed Data**
   - Invalid date formats
   - Expected: Validation errors caught

---

## User Acceptance Testing (UAT)

### Checklist for Stakeholders

- [ ] Emails look professional
- [ ] Calendly links work correctly
- [ ] Candidate names personalized
- [ ] Round information accurate
- [ ] Branding consistent
- [ ] Mobile-friendly emails
- [ ] TAT metrics useful
- [ ] Easy to monitor progress

---

## Regression Testing

After any changes, re-run:

1. ✅ Data splitting tests
2. ✅ Email sending tests
3. ✅ TAT calculation tests
4. ✅ Edge case tests
5. ✅ Integration test

---

## Test Results Template

```markdown
## Test Run: [Date]

### Environment
- Airtable Base: [Name]
- MailerSend Account: [Email]
- Test Data Size: [N records]

### Results

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC1.1 | Single round split | ✅ Pass | - |
| TC1.2 | Multi-round split | ✅ Pass | - |
| TC2.1 | Email send | ✅ Pass | - |
| TC3.1 | TAT calculation | ✅ Pass | - |

### Summary
- Total Tests: 20
- Passed: 19
- Failed: 1
- Success Rate: 95%

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Continuous Testing

### Automated Checks

Set up Airtable automations to:

1. **Daily Health Check**
   - Count pending emails
   - Alert if > 100 pending

2. **Weekly Report**
   - Total emails sent
   - Average TAT
   - Success rate

3. **Error Monitoring**
   - Alert on failed emails
   - Log errors to separate table

---

## Troubleshooting Common Test Failures

### "Email not received"
- Check spam folder
- Verify sender domain
- Check MailerSend activity log

### "TAT showing null"
- Verify formula syntax
- Check date field formats
- Ensure Mail Sent Time populated

### "Script timeout"
- Reduce batch size
- Add more delays
- Process in chunks

---

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Status:** ✅ Approved / ❌ Needs Work  
**Comments:** _______________

---

**Last Updated:** January 2024
