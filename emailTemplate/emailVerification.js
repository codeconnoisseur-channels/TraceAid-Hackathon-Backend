// Image Constants from provided URLs
const WATERMARK_URL = "https://res.cloudinary.com/dfefiap2l/image/upload/v1761935062/Email_footer_banner_1_iyfoix.png";
const LOGO_URL = "https://res.cloudinary.com/dfefiap2l/image/upload/v1760999697/TRACE_AID_LOGO_1_rwfufj.png";
const LINKEDIN_URL = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/linkedIn_ggxxm4.png";
const INSTAGRAM_URL = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/instagram_p8byzw.png";
const FACEBOOK_URL = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433532/facebook_rjeokq.png";

// Primary Brand Colors
const PRIMARY_BLUE = "#264653"; // For header, buttons, main accents
const SUCCESS_GREEN = "#617437"; // For approval/success status
const WARNING_ORANGE = "#E9C46A"; // For 'In Progress' or 'Needs More Info' status
const ALERT_RED = "#E76F51"; // For disapproval/rejection

/**
 * Generates the base HTML structure for all emails, ensuring responsiveness and consistent branding.
 * Uses inline CSS for maximum compatibility.
 * @param {string} title The title/subject for the email.
 * @param {string} mainContent The HTML content for the body section.
 * @param {string} accentColor The color for the header/primary stripe (defaults to PRIMARY_BLUE).
 * @returns {string} The complete HTML email template.
 */
const baseEmailTemplate = (title, mainContent, accentColor = PRIMARY_BLUE) => {
  // Ensure all styles are inline for maximum email client compatibility.
  const containerStyle =
    "max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0;";
  const footerBgStyle = `background: url(${WATERMARK_URL}) center / cover no-repeat; padding: 40px 0; text-align: center; color: #fff;`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style type="text/css">
        /* Reset styles */
        body, table, td, a { margin: 0; padding: 0; border-collapse: collapse; line-height: 1.6; }
        img { border: none; -ms-interpolation-mode: bicubic; }
        a { text-decoration: none; }
        /* Responsive adjustments */
        @media only screen and (max-width: 600px) {
            .full-width { width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .header-logo img { width: 100px !important; }
            .code-box { font-size: 28px !important; padding: 15px !important; }
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Poppins', sans-serif;">
    <center style="width: 100%;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${containerStyle}" class="full-width">

                        <!-- Top Accent Bar -->
                        <tr>
                            <td style="height: 5px; background-color: ${accentColor};"></td>
                        </tr>

                        <!-- Header/Logo -->
                        <tr>
                            <td style="padding: 25px 30px; text-align: center; border-bottom: 1px solid #eeeeee;" class="header-logo">
                                <img src="${LOGO_URL}" width="140" alt="TraceAid Logo" style="display: block; margin: 0 auto;">
                            </td> 
                        </tr>

                        <!-- Main Content Area -->
                        <tr>
                            <td style="padding: 30px;" class="content-padding">
                                ${mainContent}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="${footerBgStyle}">
                                <table width="80%" cellpadding="0" cellspacing="0" border="0" style="color: #ffffff; margin: 0 auto;">
                                    <tr>
                                        <td align="center">
                                            <h3 style="margin: 0; font-size: 22px;">TraceAid</h3>
                                            <p style="margin: 8px 0 20px; font-size: 13px;">
                                                Transparent Giving, Trackable Impact.
                                            </p>
                                            <div style="margin-top: 10px;">
                                                <a href="https://www.linkedin.com/company/traceaid" target="_blank" style="margin: 0 6px;">
                                                    <img src="${LINKEDIN_URL}" width="20" alt="LinkedIn" style="vertical-align: middle;">
                                                </a>
                                                <a href="https://web.facebook.com/profile.php?id=61578288375402" target="_blank" style="margin: 0 6px;">
                                                    <img src="${FACEBOOK_URL}" width="20" alt="Facebook" style="vertical-align: middle;">
                                                </a>
                                                <a href="https://www.instagram.com/traceaid" target="_blank" style="margin: 0 6px;">
                                                    <img src="${INSTAGRAM_URL}" width="20" alt="Instagram" style="vertical-align: middle;">
                                                </a>
                                            </div>
                                            <p style="margin-top: 15px; font-size: 13px;">
                                                Contact us: 
                                                <a href="mailto:traceaidofficial@gmail.com" style="color: #fff; text-decoration: underline;">
                                                    traceaidofficial@gmail.com
                                                </a>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;
};

// 1. Email Verification (Using Code)
exports.emailVerificationOTP = (firstName, verificationCode) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${PRIMARY_BLUE}; margin-bottom: 20px;">Verify Your TraceAid Account</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Welcome to TraceAid! To complete your registration and secure your account, please verify your email address using the code below:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 15px 20px; background-color: #f0f4f7; border-radius: 8px;">
                    <p style="font-size: 18px; color: #555; margin: 0;">Your verification code:</p>
                    <p class="code-box" style="font-size: 32px; font-weight: 700; color: ${PRIMARY_BLUE}; margin: 10px 0 0;">
                        ${verificationCode}
                    </p>
                </td>
            </tr>
        </table>
        <p style="font-size: 14px; color: ${ALERT_RED}; margin-top: 20px; font-weight: 600;">
            This code will expire in 10 minutes.
        </p>
        <p style="font-size: 14px; margin-top: 30px; color: #777;">
            If you didn’t sign up for a TraceAid account, you can safely ignore this email.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thanks for joining the movement for transparent giving,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Verify Your TraceAid Account", mainContent);
};

// 2. Password Reset (Using Code)
exports.passwordResetOTP = (firstName, resetCode) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${PRIMARY_BLUE}; margin-bottom: 20px;">Reset Your TraceAid Password</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We received a request to reset your password. Use the code below to continue:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 15px 20px; background-color: #f0f4f7; border-radius: 8px;">
                    <p style="font-size: 18px; color: #555; margin: 0;">Your reset code:</p>
                    <p class="code-box" style="font-size: 32px; font-weight: 700; color: ${PRIMARY_BLUE}; margin: 10px 0 0;">
                        ${resetCode}
                    </p>
                </td>
            </tr>
        </table>
        <p style="font-size: 14px; color: ${ALERT_RED}; margin-top: 20px; font-weight: 600;">
            This code will expire in 10 minutes.
        </p>
        <p style="font-size: 14px; margin-top: 30px; color: #777;">
            If you didn’t request a password reset, please ignore this email — your account is still secure.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Stay safe,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Reset Your TraceAid Password", mainContent);
};

// 3. Admin Verifying KYC (Status Update to NGO / Campaigner)
exports.kycVerificationInProgress = (firstName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">KYC Verification is in Progress</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Thank you for submitting your KYC details. Our team is currently reviewing your information to ensure platform safety and compliance.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 15px 20px; background-color: #fff8e8; border-left: 4px solid ${WARNING_ORANGE}; border-radius: 4px;">
                    <p style="font-size: 16px; font-weight: 600; color: ${WARNING_ORANGE}; margin: 0;">
                        No further action is required at this time.
                    </p>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            You’ll receive an update as soon as verification is complete.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">We appreciate your patience,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Your KYC Verification is in Progress", mainContent, WARNING_ORANGE);
};

// 4. Admin Verifying Campaigns
exports.campaignUnderReview = (firstName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">Your Campaign Is Being Reviewed</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We’ve received your campaign and it’s currently under review by our verification team to ensure authenticity and compliance with TraceAid guidelines.
        </p>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            We’ll notify you once it’s approved or if we require additional information.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thank you for choosing to fundraise transparently,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Your Campaign Is Being Reviewed", mainContent, WARNING_ORANGE);
};

// 5. Admin Verifying Milestone Evidence
exports.milestoneUnderReview = (firstName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">Milestone Evidence Submitted — Under Review</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Your milestone update and supporting evidence have been successfully submitted. Our team is now reviewing the details.
        </p>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            You will be notified once it’s approved, or if clarification is required.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thanks for keeping your donors informed and accountable,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Milestone Evidence Submitted — Under Review", mainContent, WARNING_ORANGE);
};

// 6. Campaign Approval Email
exports.campaignApproved = (firstName, campaignName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Your Campaign Has Been Approved!</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Great news! Your campaign **"${campaignName}"** has been successfully reviewed and approved by our verification team.
        </p>
        <p style="font-size: 16px; margin-bottom: 20px; color: #333; font-weight: 600;">
            Your campaign is now live on TraceAid and ready to receive donations.
        </p>
        <p style="font-size: 18px; font-weight: 700; color: ${PRIMARY_BLUE}; margin-bottom: 10px;">Remember:</p>
        <ul style="list-style: none; padding: 0; margin: 0 0 30px 20px; color: #555;">
            <li style="margin-bottom: 8px;">&#x2713; Keep donors updated as you progress.</li>
            <li style="margin-bottom: 8px;">&#x2713; Upload milestone evidence as required.</li>
            <li>&#x2713; Maintain transparency throughout your campaign.</li>
        </ul>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">We’re excited to see the impact you’ll create!</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">Best of luck, The TraceAid Team</p>
    `;
  return baseEmailTemplate("Your Campaign Has Been Approved!", mainContent, SUCCESS_GREEN);
};

// 7. Campaign Approval (Needs More Info)
exports.campaignNeedsMoreInfo = (firstName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">Additional Information Required for Your Campaign</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Thanks for submitting your campaign. After reviewing it, we need some clarification or additional documents to proceed with approval.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[dashboard_link]]" target="_blank"
                       style="display: inline-block; background-color: ${PRIMARY_BLUE}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${PRIMARY_BLUE};">
                        View Required Details
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Once submitted, we’ll continue the review.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thank you for your cooperation,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Additional Information Required for Your Campaign", mainContent, WARNING_ORANGE);
};

// 8. Milestone Verification Approval
exports.milestoneApproved = (firstName, campaignName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Milestone Update Successfully Approved</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Your milestone update for **"${campaignName}"** has been reviewed and approved.
        </p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin-bottom: 20px;">
            This milestone will now be visible to your donors, helping them track your progress clearly.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Keep up the great work,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Milestone Update Successfully Approved", mainContent, SUCCESS_GREEN);
};

// 9. Milestone Verification (Needs More Info)
exports.milestoneNeedsMoreInfo = (firstName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">Clarification Needed for Your Milestone Update</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We’ve reviewed your recent milestone evidence and require additional details or clearer documentation before approval.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[dashboard_link]]" target="_blank"
                       style="display: inline-block; background-color: ${PRIMARY_BLUE}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${PRIMARY_BLUE};">
                        Review Our Request
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please check your dashboard to view our request and take action.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thanks for ensuring transparency,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Clarification Needed for Your Milestone Update", mainContent, WARNING_ORANGE);
};

// 10. Campaign Disapproval Email
exports.campaignDisapproved = (firstName, campaignName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${ALERT_RED}; margin-bottom: 20px;">Your Campaign Could Not Be Approved</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Thank you for submitting your campaign **"${campaignName}"**. After reviewing your application, we’re unable to approve it at this time due to one or more issues with the information provided.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[dashboard_link]]" target="_blank"
                       style="display: inline-block; background-color: ${ALERT_RED}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${ALERT_RED};">
                        View Feedback & Corrections
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please log into your dashboard to view the feedback and required corrections. Once updated, you can resubmit your campaign for verification.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">We appreciate your understanding,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Your Campaign Could Not Be Approved", mainContent, ALERT_RED);
};

// 11. Milestone Disapproval Email
exports.milestoneDisapproved = (firstName, campaignName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${ALERT_RED}; margin-bottom: 20px;">Your Milestone Evidence Could Not Be Approved</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We’ve reviewed the milestone update you submitted for **"${campaignName}"**, and we’re unable to approve it at this time. This could be due to unclear, incomplete, or insufficient supporting evidence.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[dashboard_link]]" target="_blank"
                       style="display: inline-block; background-color: ${ALERT_RED}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${ALERT_RED};">
                        Check Specific Feedback
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please check your dashboard for specific feedback and next steps. Once corrected, you can resubmit your milestone for review.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thank you for maintaining transparency with your donors,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Your Milestone Evidence Could Not Be Approved", mainContent, ALERT_RED);
};

// Custom email exports for legacy support (if needed, otherwise remove these)
// These two mimic the structure of your original exports but use the new template style.

// You had a specific function for "registerOTP"
exports.registerOTP = (otp, firstname) => {
  return exports.emailVerificationOTP(firstname, otp);
};

// You had a specific function for "forgotPasswordLink" which is now replaced by "passwordResetOTP" since the UI/UX used a code.
// Note: If you require a link-based reset (as in your commented-out code), you would need to adjust this, but since the UI/UX provided a code-based flow, I used that.
// If you want to use this function to represent a link-based reset, here is how it would look:
exports.forgotPasswordLink = (resetUrl, firstname) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${PRIMARY_BLUE}; margin-bottom: 20px;">Password Reset Request</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstname},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            You requested a password reset for your TraceAid account. Click the button below to securely set a new password.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="${resetUrl}" target="_blank"
                       style="display: inline-block; background-color: ${PRIMARY_BLUE}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 5px; border: 1px solid ${PRIMARY_BLUE};">
                        Reset My Password
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 14px; color: ${ALERT_RED}; margin-top: 20px; font-weight: 600;">
            This link is valid for a limited time.
        </p>
        <p style="font-size: 14px; margin-top: 30px; color: #777;">
            If you did not request this, please ignore this email. Your account remains secure.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Stay safe,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Password Reset Request", mainContent);
};

// You had two multi-purpose status functions which are now replaced by the specific 11 scenarios above.
// The following two exports are deprecated but included for reference on how they were structured.
// exports.kycStatusEmail = (statusMessage, organizationName) => { /* ... */ };
// exports.campaignStatusEmail = (organizationName, action, title, remarks) => { /* ... */ };

// Expose all 11 specific templates for direct use:
module.exports = {
  emailVerificationOTP: exports.emailVerificationOTP,
  passwordResetOTP: exports.passwordResetOTP,
  kycVerificationInProgress: exports.kycVerificationInProgress,
  campaignUnderReview: exports.campaignUnderReview,
  milestoneUnderReview: exports.milestoneUnderReview,
  campaignApproved: exports.campaignApproved,
  campaignNeedsMoreInfo: exports.campaignNeedsMoreInfo,
  milestoneApproved: exports.milestoneApproved,
  milestoneNeedsMoreInfo: exports.milestoneNeedsMoreInfo,
  campaignDisapproved: exports.campaignDisapproved,
  milestoneDisapproved: exports.milestoneDisapproved,

  // Legacy exports, now mapped to the new functions for backward compatibility:
  registerOTP: exports.registerOTP,
  forgotPasswordLink: exports.forgotPasswordLink,
};
