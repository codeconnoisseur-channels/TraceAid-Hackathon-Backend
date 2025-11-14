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

const baseEmailTemplate = (title, mainContent, accentColor = PRIMARY_BLUE) => {
  // Ensure all styles are inline for maximum email client compatibility.
  const containerStyle =
    "max-width: 600px; margin: 0 auto; background-color: rgba(24, 24, 24, 0.4); font-family: 'Poppins', sans-serif; padding: 20px 0; border-bottom: 1px solid #e0e0e0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0;us: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0;";
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

<body style="margin: 0; padding: 0; background-color: #fff; font-family: 'Poppins', sans-serif;">
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
exports.kycVerificationInProgress = (organizationName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">KYC Verification is in Progress</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
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

exports.campaignAndMilestonesUnderReview = (organizationName, campaignTitle, milestones) => {
  const milestoneList = milestones
    .map(
      (m, index) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-weight: 600; color: #333;">Milestone ${index + 1}: ${m.milestoneTitle}</td>
            <td style="padding: 10px 0; text-align: right; color: #555;">${m.targetAmount.toLocaleString()}</td>
        </tr>
    `
    )
    .join("");

  const mainContent = `
        <h1 style="font-size: 24px; color: ${WARNING_ORANGE}; margin-bottom: 20px;">Campaign & Milestones Under Review 📝</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Thank you for submitting your new campaign, <strong>${campaignTitle}</strong>, along with its associated milestones. 
            All details are now under review by our team to ensure compliance with TraceAid guidelines.
        </p>

        <h2 style="font-size: 18px; color: ${PRIMARY_BLUE}; margin-top: 30px; margin-bottom: 10px;">Submitted Milestones (${milestones.length})</h2>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid ${PRIMARY_BLUE};">
                    <th style="padding: 10px 0; text-align: left; font-size: 14px; color: ${PRIMARY_BLUE};">Description</th>
                    <th style="padding: 10px 0; text-align: right; font-size: 14px; color: ${PRIMARY_BLUE};">Target Amount</th>
                </tr>
            </thead>
            <tbody>
                ${milestoneList}
            </tbody>
        </table>
        
        <p style="font-size: 16px; margin-top: 30px; color: #333;">
            We will notify you once the campaign is approved or if any additional information is required.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thank you for choosing to fundraise transparently,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Campaign and Milestones Under Review", mainContent, WARNING_ORANGE);
};

exports.campaignApproved = (firstName, campaignName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Your Campaign Has Been Approved!</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Great news! Your campaign <strong>${campaignName}</strong> has been successfully reviewed and approved by our verification team.
        </p>
        <p style="font-size: 16px; margin-bottom: 20px; color: #333; font-weight: 600;">
            <em><strong>NOTE :</strong> Your Campaign is not yet live to receive donation</em><br/>
            <em><strong>Next Steps :</strong> Upon verification that you have not exceeded the limit of 3 campaigns that can be created at a time, your campaign status will be moved to live.</em>
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

// 8. Campaign Active Email
exports.campaignActive = (organizationName, campaignTitle, endDate) => {
    const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'an indefinite date';

  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Campaign Is Now LIVE! 🚀</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Fantastic news! Your campaign, <strong>${campaignTitle}</strong>, has been officially set to **active** and is now live on the TraceAid platform!
        </p>
        <p style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 15px;">
            It will run until **${formattedEndDate}**.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[campaign_link]]" target="_blank"
                       style="display: inline-block; background-color: ${SUCCESS_GREEN}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${SUCCESS_GREEN};">
                        View Your Live Campaign
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Start sharing your campaign link with your network! We wish you the best in achieving your goals.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Let's create impact together,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Campaign Is Now LIVE!", mainContent, SUCCESS_GREEN);
};

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

exports.campaignDisapproved = (organizationName, campaignTitle, rejectionReason) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${ALERT_RED}; margin-bottom: 20px;">Your Campaign Could Not Be Approved</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Thank you for submitting your campaign <strong>${campaignTitle}</strong>. After reviewing your application, we’re unable to approve it at this time.
        </p>
        
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td style="padding: 15px; background-color: #fcebeb; border-left: 4px solid ${ALERT_RED}; border-radius: 4px; color: #333;">
                    <p style="font-size: 16px; font-weight: 600; margin: 0 0 5px 0; color: ${ALERT_RED};">Reason for Disapproval:</p>
                    <p style="font-size: 16px; margin: 0;">${rejectionReason}</p>
                </td>
            </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td align="center">
                    <a href="[[dashboard_link]]" target="_blank"
                       style="display: inline-block; background-color: ${ALERT_RED}; color: #ffffff; font-size: 16px; 
                       font-weight: 600; text-decoration: none; padding: 12px 25px; border-radius: 5px; border: 1px solid ${ALERT_RED};">
                        View Dashboard
                    </a>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please log into your dashboard to update your campaign based on the feedback. Once corrected, you can resubmit your campaign for verification.
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

exports.kycApproved = (organizationName) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">KYC Verification Approved! 🎉</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Congratulations! Your KYC verification has been successfully approved.
        </p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin-bottom: 20px;">
            This approval confirms your legitimacy and allows you to submit campaigns and receive funds on TraceAid.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Welcome aboard, let's start creating impact!</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("KYC Verification Approved!", mainContent, SUCCESS_GREEN);
};

exports.kycRejected = (organizationName, rejectionReason) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${ALERT_RED}; margin-bottom: 20px;">KYC Verification Could Not Be Approved</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We regret to inform you that your KYC verification could not be approved at this time.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td style="padding: 15px; background-color: #fcebeb; border-left: 4px solid ${ALERT_RED}; border-radius: 4px; color: #333;">
                   <p style="font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Reason for Rejection:</p>
                    <p style="font-size: 16px; margin: 0;">${rejectionReason}</p>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please log into your dashboard to update your information and resubmit for review.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">We look forward to your resubmission,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("KYC Verification Could Not Be Approved", mainContent, ALERT_RED);
};

exports.durationExtensionApproved = (firstName, campaignName, newDuration) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Campaign Duration Extended!</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Good news! Your request to extend the duration of **"${campaignName}"** has been **approved**.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td style="padding: 15px; background-color: #e8fce8; border-left: 4px solid ${SUCCESS_GREEN}; border-radius: 4px; color: #333;">
                    <p style="font-size: 16px; font-weight: 600; margin: 0;">The campaign deadline has been successfully updated. Your new end date is **${newDuration}**.</p>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Use this extra time to reach your goal! Don't forget to update your donors.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Best regards,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Campaign Duration Extended", mainContent, SUCCESS_GREEN);
};

exports.durationExtensionRejected = (firstName, campaignName, rejectionReason) => {
  const mainContent = `
        <h1 style="font-size: 24px; color: ${ALERT_RED}; margin-bottom: 20px;">Campaign Extension Request Declined</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            We have reviewed your request to extend the duration of **"${campaignName}"** but have decided to **decline** it at this time.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
            <tr>
                <td style="padding: 15px; background-color: #fcebeb; border-left: 4px solid ${ALERT_RED}; border-radius: 4px; color: #333;">
                    <p style="font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Reason for Decline:</p>
                    <p style="font-size: 16px; margin: 0;">${rejectionReason}</p>
                </td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            Please continue to work toward your original deadline.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">The TraceAid Team</p>
    `;
  return baseEmailTemplate("Campaign Extension Request Declined", mainContent, ALERT_RED);
};

exports.registerOTP = (otp, firstname) => {
  return exports.emailVerificationOTP(firstname, otp);
};

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

exports.payoutRequestSuccessEmail = (organizationName, campaignTitle, milestoneTitle, targetAmount, referenceID) => {
    const formattedAmount = `₦${Number(targetAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const mainContent = `
        <h1 style="font-size: 24px; color: ${SUCCESS_GREEN}; margin-bottom: 20px;">Withdrawal Request Submitted!</h1>
        <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Hello ${organizationName},</p>
        <p style="font-size: 16px; margin-bottom: 25px; color: #333;">
            Your request to withdraw funds for the following milestone has been successfully submitted and is now **pending administrative review**.
        </p>
        <table width="100%" cellpadding="10" cellspacing="0" border="0" style="margin: 20px 0; border: 1px solid #eeeeee; border-radius: 8px; font-size: 14px;">
            <tr style="background-color: #f9f9f9;">
                <td style="font-weight: 600; color: ${PRIMARY_BLUE}; width: 35%;">Campaign Title:</td>
                <td style="color: #333;">${campaignTitle}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: ${PRIMARY_BLUE};">Milestone Title:</td>
                <td style="color: #333;">${milestoneTitle}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="font-weight: 600; color: ${PRIMARY_BLUE};">Amount Requested:</td>
                <td style="color: ${SUCCESS_GREEN}; font-weight: 700;">${formattedAmount}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: ${PRIMARY_BLUE};">Reference ID:</td>
                <td style="color: #333;">${referenceID}</td>
            </tr>
        </table>
        <p style="font-size: 16px; margin-top: 20px; color: #333;">
            You will receive a notification as soon as the TraceAid administration reviews and processes the transfer.
        </p>
        <p style="font-size: 16px; margin-top: 25px; color: #333;">Thank you for your impactful work,</p>
        <p style="font-size: 16px; font-weight: 600; color: ${PRIMARY_BLUE}; margin: 0;">The TraceAid Team</p>
    `;
    return baseEmailTemplate("Withdrawal Request Submitted - Pending Review", mainContent, PRIMARY_BLUE);
};