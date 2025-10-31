// const fs = require("fs");
// const { forgotPasswordLink, registerOTP } = require("../emailTemplate/emailVerification");

// // For now, just use a dummy reset link (for testing)
// const verifyEmail = registerOTP("12345", "TestUser");
// const forgotPasswordEmail = forgotPasswordLink("http://localhost:5050/api/v1/reset-password?token=12345", "TestUser");

// fs.writeFileSync("verifyEmail.html", verifyEmail, "utf8");
// fs.writeFileSync("forgotPasswordEmail.html", forgotPasswordEmail, "utf-8")

// console.log("✅ Open the email html thats in project directory in your browser to see how the email looks");


const fs = require("fs");
// NOTE: Please adjust the path below if your emailTemplates.js is located elsewhere
const templates = require("../emailTemplate/emailVerification"); 

// --- Mock Data for Template Generation ---
const MOCK_DATA = {
    firstName: "Alex",
    otp: "123456",
    campaignName: "Building Schools in Rural Kenya",
    resetUrl: "http://traceaid.com/reset?token=xyz123"
};

// Array of all template functions and the corresponding filenames to generate
const emailJobs = [
    // 1. Authentication
    { func: templates.emailVerificationOTP, args: [MOCK_DATA.firstName, MOCK_DATA.otp], filename: "1_Auth_EmailVerificationOTP.html" },
    { func: templates.passwordResetOTP, args: [MOCK_DATA.firstName, MOCK_DATA.otp], filename: "2_Auth_PasswordResetOTP.html" },
    { func: templates.forgotPasswordLink, args: [MOCK_DATA.resetUrl, MOCK_DATA.firstName], filename: "3_Auth_ForgotPasswordLink.html" },

    // 2. Under Review / In Progress (Orange Accent)
    { func: templates.kycVerificationInProgress, args: [MOCK_DATA.firstName], filename: "4_Review_KYCInProgress.html" },
    { func: templates.campaignUnderReview, args: [MOCK_DATA.firstName], filename: "5_Review_CampaignUnderReview.html" },
    { func: templates.milestoneUnderReview, args: [MOCK_DATA.firstName], filename: "6_Review_MilestoneUnderReview.html" },
    
    // 3. Approval (Green Accent)
    { func: templates.campaignApproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "7_Approval_CampaignApproved.html" },
    { func: templates.milestoneApproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "8_Approval_MilestoneApproved.html" },

    // 4. Needs More Info (Orange Accent)
    { func: templates.campaignNeedsMoreInfo, args: [MOCK_DATA.firstName], filename: "9_Action_CampaignNeedsMoreInfo.html" },
    { func: templates.milestoneNeedsMoreInfo, args: [MOCK_DATA.firstName], filename: "10_Action_MilestoneNeedsMoreInfo.html" },

    // 5. Disapproval (Red Accent)
    { func: templates.campaignDisapproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "11_Rejection_CampaignDisapproved.html" },
    { func: templates.milestoneDisapproved, args: [MOCK_DATA.firstName, MOCK_DATA.campaignName], filename: "12_Rejection_MilestoneDisapproved.html" },
];


// --- Execution Logic ---
console.log("Starting email template HTML generation...");
let filesGenerated = 0;

try {
    emailJobs.forEach(job => {
        // Call the template function with its specific arguments
        const emailHtml = job.func(...job.args);
        
        // Write the resulting HTML to a file
        fs.writeFileSync(job.filename, emailHtml, "utf8");
        
        console.log(`\t[✔] Generated: ${job.filename}`);
        filesGenerated++;
    });

    console.log(`\n✅ Successfully generated ${filesGenerated} email files. Open the HTML files in your browser to preview the designs.`);

} catch (error) {
    console.error("❌ An error occurred during email generation. Check the path to 'emailTemplates.js' and ensure all imported modules are correctly available.", error);
}
