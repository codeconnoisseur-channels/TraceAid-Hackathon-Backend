const fs = require("fs");
const templates = require("../emailTemplate/emailVerification");

const MOCK_DATA = {
  firstName: "Alex",
  otp: "123456",
  campaignName: "Building Schools in Rural Kenya",
  resetUrl: "http://traceaid.com/reset?token=xyz123",
  milestoneMock: [
    { milestoneTitle: "Phase 1: Foundation", targetAmount: 500000 },
    { milestoneTitle: "Phase 2: Walls & Roof", targetAmount: 1000000 },
  ],
  rejectionReason: "Supporting documents for the land title were blurry and unreadable.",
  endDateMock: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Date 30 days from now
  newDurationMock: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Date 60 days from now

  // Payout Mock Data (Required for payoutApprovedTemplate)
  amountMock: 250000.0,
  bankNameMock: "First Bank PLC",
  accountNameMock: "Fundraiser NGO Trust",
  accountNumberMock: "1234567890",
};

// Array of all template functions and the corresponding filenames to generate
const emailJobs = [
  // 1. Authentication (PRIMARY_BLUE)
  { func: templates.emailVerificationOTP, args: [MOCK_DATA.firstName, MOCK_DATA.otp], filename: "1_Auth_EmailVerificationOTP.html" },
  { func: templates.passwordResetOTP, args: [MOCK_DATA.firstName, MOCK_DATA.otp], filename: "2_Auth_PasswordResetOTP.html" },

  // 2. KYC Status (Orange Accent)
  { func: templates.kycVerificationInProgress, args: [MOCK_DATA.firstName], filename: "3_KYC_KYCInProgress.html" },

  // 3. Campaign & Milestone Review/Action (Orange Accent)
  {
    func: templates.campaignAndMilestonesUnderReview,
    args: [MOCK_DATA.firstName, MOCK_DATA.campaignName, MOCK_DATA.milestoneMock],
    filename: "4_Review_CampaignAndMilestonesUnderReview.html",
  },
  { func: templates.campaignNeedsMoreInfo, args: [MOCK_DATA.firstName], filename: "5_Action_CampaignNeedsMoreInfo.html" },
  { func: templates.milestoneNeedsMoreInfo, args: [MOCK_DATA.firstName], filename: "6_Action_MilestoneNeedsMoreInfo.html" },

  // 4. Approval (Green Accent)
  { func: templates.kycApproved, args: [MOCK_DATA.firstName], filename: "7_Approval_KYCApproved.html" },
  { func: templates.campaignApproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "8_Approval_CampaignApproved.html" },
  {
    func: templates.campaignActive,
    args: [MOCK_DATA.firstName, MOCK_DATA.campaignName, MOCK_DATA.endDateMock],
    filename: "9_Approval_CampaignActive.html",
  },
  { func: templates.milestoneApproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "10_Approval_MilestoneApproved.html" },
  {
    func: templates.durationExtensionApproved,
    args: [MOCK_DATA.firstName, MOCK_DATA.campaignName, MOCK_DATA.newDurationMock],
    filename: "11_Approval_DurationExtensionApproved.html",
  },

  // **Payout Approved Template (Added to Approval section)**
  {
    func: templates.payoutApprovedTemplate,
    args: [MOCK_DATA.firstName, MOCK_DATA.amountMock, MOCK_DATA.bankNameMock, MOCK_DATA.accountNameMock, MOCK_DATA.accountNumberMock],
    filename: "12_Success_PayoutApproved.html",
  },

  // 5. Disapproval (Red Accent) - Renumbered
  { func: templates.kycRejected, args: [MOCK_DATA.firstName, MOCK_DATA.rejectionReason], filename: "13_Rejection_KYCRejected.html" },
  {
    func: templates.campaignDisapproved,
    args: [MOCK_DATA.firstName, MOCK_DATA.campaignName, MOCK_DATA.rejectionReason],
    filename: "14_Rejection_CampaignDisapproved.html",
  },
  { func: templates.milestoneDisapproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "15_Rejection_MilestoneDisapproved.html" },
];

// --- Execution Logic (The rest of your script remains the same) ---
console.log("Starting email template HTML generation...");
let filesGenerated = 0;

try {
  emailJobs.forEach((job) => {
    // FIX: Check if the template function is available before calling it
    if (typeof job.func !== "function") {
      console.warn(`\t[!] WARNING: Template function for ${job.filename} is missing or not exported. Skipping.`);
      return; // Skips the job if the function is missing
    }
    // Call the template function with its specific arguments
    const emailHtml = job.func(...job.args);

    // Write the resulting HTML to a file
    fs.writeFileSync(job.filename, emailHtml, "utf8");

    console.log(`\t[✔] Generated: ${job.filename}`);
    filesGenerated++;
  });

  console.log(`\n✅ Successfully generated ${filesGenerated} email files. Open the HTML files in your browser to preview the designs.`);
} catch (error) {
  console.error(
    "❌ An error occurred during email generation. Check the path to 'emailTemplates.js' and ensure all imported modules are correctly available.",
    error
  );
}
