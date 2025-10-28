const watermark =
  "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754353355/watermark_fdbzah.png";
const logo =
  "https://res.cloudinary.com/dfefiap2l/image/upload/v1760999697/TRACE_AID_LOGO_1_rwfufj.png";
const linkedIn =
  "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/linkedIn_ggxxm4.png";
const instagram =
  "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/instagram_p8byzw.png";
const facebook =
  "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433532/facebook_rjeokq.png";

exports.registerOTP = (otp, firstname) => {
  return `
    <!DOCTYPE html>
<html>
 <head>
    <meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>email</title>
    <link rel="stylesheet" href="./index.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet">
      <style>
        *{
        margin: 0;
        padding: 0;
      }
      </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: transparent;">
    <center style="width: 100%;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: transparent; font-family: Poppins, sans-serif;">
        <tr>
          <td style="margin: 0px">
            <img src="${logo}" width="140">
          </td> 
        </tr>
        <tr>
          <td style="height: 350px">
            <h1 style="font-size: 35px; font-weight: bold; margin: 0 0 10px;">Email Verification</h1>
            <h2 style="font-size: 20px; margin: 0 0 10px;">Hi ${firstname},</h2>
            <p style="font-size: 17px; margin: 0 0 20px;">Here's your 6-digit code, enter it to verify your email and unlock the Trace Aid's fast experience!</p>
            <h2 style="font-size: 35px; font-weight: bold; background: #c2cfd3; padding: 10px; border-radius: 5px; text-align: center;">${otp}</h2>
            <p style="font-size: 17px; margin: 20px 0px 10px 0px;">Need help? Reach out to our support team below.</p>
            <p style="font-size: 17px;">Thank you for choosing Trace Aid.</p>
          </td>
        </tr>
        <tr>
          <td style="height: 250px; background: url(${watermark}) center / cover no-repeat;">
              <table width="80%" cellpadding="0" cellspacing="0"
            style="color: #ffffff; margin: 0 auto;">
            <tr>
              <td align="center">
                <h3 style="margin: 0; font-size: 25px;">Trace Aid</h3>
                <p style="margin: 8px 0 20px; font-size: 12px;">
                  TraceAid. Making everyday deliveries faster, easier, and<br>right when you need them.
                </p>
                <table cellpadding="5" cellspacing="0" style="margin: 10px 0; text-align: center;">
                  <tr>
                    <td style="font-size: 12px;">Follow us:</td>
                    <td><a href=""><img src="${linkedIn}" alt="LinkedIn" width="20" style="vertical-align: middle; margin-left: 10px;"></a></td>
                    <td><a href="https://web.facebook.com/profile.php?id=61578288375402"><img src="${facebook}" alt="Facebook" width="20" style="vertical-align: middle; margin-left: 5px;"></a></td>
                    <td><a href=""><img src="${instagram}" alt="Instagram" width="20" style="vertical-align: middle; margin-left: 5px;"></a></td>
                  </tr>
                </table>
                <p style="margin: 10px 0 0; font-size: 12px;">
                  Contact us: &nbsp; +234 810 4914 850 &nbsp;
                  <a href="mailto:traceaidofficial@gmail.com" style="color: #ffffff; text-decoration: underline;">
                    traceaidofficial@gmail.com
                  </a>
                </p>
              </td>
            </tr>
          </table>
          </td>
        </tr>
        <tr>s
          <td style="height: 5px; background-color: #4e26ebff;"></td>
        </tr>
      </table>
    </center>
  </body>
</html>
`;
};

// exports.forgotPasswordLink = (resetUrl, firstname) => {
//   return `
//     <!DOCTYPE html>
// <html>
//   <head>
//     <meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Password Reset</title>
//     <style>
//       *{
//         margin: 0;
//         padding: 0;
//       }
//     </style>
//   </head>
//   <body style="margin: 0; padding: 0; background-color: transparent;">
//     <center style="width: 100%;">
//       <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: transparent; font-family: Poppins, sans-serif;">
//         <tr>
//           <td style="margin: 0px">
//             <img src="${logo}" width="140">
//           </td>
//         </tr>
//         <tr>
//           <td style="height: 350px">
//             <h1 style="font-size: 35px; font-weight: bold; margin: 0 0 10px; color: #4e26ebff;">Password Reset Request</h1>
//             <h2 style="font-size: 20px; margin: 0 0 10px;">Hi ${firstname},</h2>
//             <p style="font-size: 17px; margin: 0 0 20px;">
//               You requested a password reset for your TraceAid account. Click the button below to securely set a new password.
//             </p>

//             <table cellpadding="0" cellspacing="0" style="margin: 30px auto; width: 100%; max-width: 300px;">
//               <tr>
//                 <td align="center" style="background-color: #4e26ebff; border-radius: 5px; padding: 12px 20px;">
//                   <a href="${resetUrl}" target="_blank" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; display: block;">
//                     Reset My Password
//                   </a>
//                 </td>
//               </tr>
//             </table>
//             <p style="font-size: 15px; margin: 0 0 15px; color: #888;">
//               This link is only valid for a limited time  10 minutes. If you did not request this, please ignore this email.
//             </p>
//             <p style="font-size: 17px;">Thank you for choosing TraceAid.</p>
//           </td>
//         </tr>
//         <tr>
//           <td style="height: 250px; background: url(${watermark}) center / cover no-repeat;">
//             </td>
//         </tr>
//         <tr>s
//           <td style="height: 5px; background-color: #4e26ebff;"></td>
//         </tr>
//       </table>
//     </center>
//   </body>
// </html>
// `;
// };

exports.forgotPasswordLink = (resetUrl, firstname) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
      rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        font-family: 'Poppins', sans-serif;
        
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: transparent;">
    <center style="width: 100%;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width: 600px; margin: 0 auto; background-color: transparent; font-family: Poppins, sans-serif;">
        
        <!-- Logo -->
        <tr>
          <td style="margin: 0px; background-color: grey">
            <img src="${logo}" width="140">
          </td> 
        </tr>

        <!-- Main content -->
        <tr>
          <td style="height: 350px;">
            <h1 style="font-size: 35px; font-weight: bold; margin: 0 0 10px;">Password Reset Request</h1>
            <h2 style="font-size: 20px; margin: 0 0 10px;">Hi ${firstname},</h2>
            <p style="font-size: 17px; margin: 0 0 20px;">
              You requested to reset your password. Click the button below to securely set a new password for your Trace Aid account.
            </p>

            <!-- Reset Button -->
            <a href="${resetUrl}" target="_blank"
              style="display: inline-block; background-color: grey; color: #ffffff; font-size: 18px; 
              font-weight: bold; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin: 20px 0;">
              Reset My Password
            </a>

            <p style="font-size: 15px; color: #888; margin: 15px 0;">
              This link is valid for a 10 minutes. If you did not request this, please ignore this email.
            </p>
            <p style="font-size: 17px;">Thank you for choosing Trace-Aid.</p>
          </td>
        </tr>

        <!-- Footer with watermark -->
        <tr>
          <td style="height: 250px; background: url(${watermark}) center / cover no-repeat;">
            <table width="80%" cellpadding="0" cellspacing="0" style="color: #ffffff; margin: 0 auto;">
              <tr>
                <td align="center">
                  <h3 style="margin: 0; font-size: 25px;">Trace Aid</h3>
                  <p style="margin: 8px 0 20px; font-size: 12px;">
                    TraceAid. Making everyday deliveries faster, easier, and<br>right when you need them.
                  </p>
                  <table cellpadding="5" cellspacing="0" style="margin: 10px 0; text-align: center;">
                    <tr>
                      <td style="font-size: 12px;">Follow us:</td>
                      <td><a href=""><img src="${linkedIn}" alt="LinkedIn" width="20" style="vertical-align: middle; margin-left: 10px;"></a></td>
                      <td><a href="https://web.facebook.com/profile.php?id=61578288375402"><img src="${facebook}" alt="Facebook" width="20" style="vertical-align: middle; margin-left: 5px;"></a></td>
                      <td><a href=""><img src="${instagram}" alt="Instagram" width="20" style="vertical-align: middle; margin-left: 5px;"></a></td>
                    </tr>
                  </table>
                  <p style="margin: 10px 0 0; font-size: 12px;">
                    Contact us: &nbsp; +234 810 4914 850 &nbsp;
                    <a href="mailto:traceaidofficial@gmail.com" style="color: #ffffff; text-decoration: underline;">
                      traceaidofficial@gmail.com
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom border -->
        <tr>
          <td style="height: 5px; background-color: grey;"></td>
        </tr>
      </table>
    </center>
  </body>
</html>
`;
};

// emailTemplates/kycStatusEmail.js

exports.kycStatusEmail = (statusMessage, organizationName) => {
  const isApproved = statusMessage.toLowerCase().includes("approved");
  const statusColor = isApproved ? "#27ae60" : "#e74c3c";
  const statusTitle = isApproved
    ? "KYC Verification Approved"
    : "KYC Verification Rejected";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC Verification Update</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
        rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
        }
      </style>
    </head>

    <body style="margin: 0; padding: 0; background-color: #f8f8f8;">
      <center style="width: 100%;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4A4A4A; padding: 15px; text-align: center;">
              <img src="\${logo}" width="140" alt="TraceAid Logo">
            </td> 
          </tr>

          <!-- Status Bar -->
          <tr>
            <td style="background-color: ${statusColor}; text-align: center; padding: 12px 0;">
              <h2 style="color: white; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">
                ${statusTitle}
              </h2>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px; text-align: left;">
              <p style="font-size: 17px; margin-bottom: 15px; color: #333;">
                Hi ${organizationName},
              </p>

              <p style="font-size: 16px; color: #444; line-height: 1.6;">
                ${statusMessage}
              </p>

              <p style="font-size: 15px; color: #555; margin: 25px 0;">
                Thank you for taking the time to verify your identity with TraceAid.
                This helps us maintain trust and transparency in every fundraising campaign.
              </p>

              <p style="font-size: 16px; margin-top: 25px; font-weight: 600; color: #333;">– The TraceAid Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: url(\${watermark}) center / cover no-repeat; padding: 40px 0; text-align: center; color: #fff;">
              <h3 style="margin: 0; font-size: 22px;">TraceAid</h3>
              <p style="margin: 8px 0 20px; font-size: 13px;">
                Bringing transparency to fundraising — one verified milestone at a time.
              </p>
              <div style="margin-top: 10px;">
                <a href="https://www.linkedin.com/company/traceaid" target="_blank">
                  <img src="\${linkedIn}" width="20" alt="LinkedIn" style="margin: 0 6px;">
                </a>
                <a href="https://web.facebook.com/profile.php?id=61578288375402" target="_blank">
                  <img src="\${facebook}" width="20" alt="Facebook" style="margin: 0 6px;">
                </a>
                <a href="https://www.instagram.com/traceaid" target="_blank">
                  <img src="\${instagram}" width="20" alt="Instagram" style="margin: 0 6px;">
                </a>
              </div>
              <p style="margin-top: 15px; font-size: 13px;">
                Contact us: <a href="mailto:traceaidofficial@gmail.com" style="color: #fff; text-decoration: underline;">
                  traceaidofficial@gmail.com
                </a> | +234 810 4914 850
              </p>
            </td>
          </tr>

          <!-- Bottom border -->
          <tr>
            <td style="height: 5px; background-color: #4A4A4A;"></td>
          </tr>
        </table>
      </center>
    </body>
  </html>
  `;
};

exports.campaignStatusEmail = (organizationName, action, title, remarks) => {
  const isApproved = action.toLowerCase() === "approved";
  const statusColor = isApproved ? "#27ae60" : "#e74c3c";
  const statusTitle = isApproved
    ? "Campaign Approval Notification"
    : "Campaign Rejection Notification";
  const statusMessage = isApproved
    ? `Your campaign titled <strong>"${title}"</strong> has been successfully approved and is now live on TraceAid.`
    : `Unfortunately, your campaign titled <strong>"${title}"</strong> has been rejected. Please review the feedback below and make the necessary adjustments.`;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Campaign Status Update</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
        rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
        }
      </style>
    </head>

    <body style="margin: 0; padding: 0; background-color: #f8f8f8;">
      <center style="width: 100%;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4A4A4A; padding: 15px; text-align: center;">
              <img src="\${logo}" width="140" alt="TraceAid Logo">
            </td> 
          </tr>

          <!-- Status Bar -->
          <tr>
            <td style="background-color: ${statusColor}; text-align: center; padding: 12px 0;">
              <h2 style="color: white; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">
                ${statusTitle}
              </h2>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px; text-align: left;">
              <p style="font-size: 17px; margin-bottom: 15px; color: #333;">
                Hi ${organizationName},
              </p>

              <p style="font-size: 16px; color: #444; line-height: 1.6;">
                ${statusMessage}
              </p>

              ${
                !isApproved && remarks
                  ? `<div style="margin-top: 20px; background-color: #fff4f4; border-left: 5px solid #e74c3c; padding: 15px;">
                    <p style="font-size: 15px; color: #555; margin: 0;">
                      <strong>Admin Remarks:</strong><br>
                      ${remarks}
                    </p>
                  </div>`
                  : ""
              }

              <p style="font-size: 15px; color: #555; margin: 25px 0;">
                ${
                  isApproved
                    ? "We’re thrilled to see your campaign go live. Let’s create impact together!"
                    : "You can update your campaign and resubmit it for review once corrections are made."
                }
              </p>

              <p style="font-size: 16px; margin-top: 25px; font-weight: 600; color: #333;">– The TraceAid Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: url(\${watermark}) center / cover no-repeat; padding: 40px 0; text-align: center; color: #fff;">
              <h3 style="margin: 0; font-size: 22px;">TraceAid</h3>
              <p style="margin: 8px 0 20px; font-size: 13px;">
                Bringing transparency to fundraising — one verified milestone at a time.
              </p>
              <div style="margin-top: 10px;">
                <a href="https://www.linkedin.com/company/traceaid" target="_blank">
                  <img src="\${linkedIn}" width="20" alt="LinkedIn" style="margin: 0 6px;">
                </a>
                <a href="https://web.facebook.com/profile.php?id=61578288375402" target="_blank">
                  <img src="\${facebook}" width="20" alt="Facebook" style="margin: 0 6px;">
                </a>
                <a href="https://www.instagram.com/traceaid" target="_blank">
                  <img src="\${instagram}" width="20" alt="Instagram" style="margin: 0 6px;">
                </a>
              </div>
              <p style="margin-top: 15px; font-size: 13px;">
                Contact us: <a href="mailto:traceaidofficial@gmail.com" style="color: #fff; text-decoration: underline;">
                  traceaidofficial@gmail.com
                </a> | +234 810 4914 850
              </p>
            </td>
          </tr>

          <!-- Bottom border -->
          <tr>
            <td style="height: 5px; background-color: #4A4A4A;"></td>
          </tr>
        </table>
      </center>
    </body>
  </html>
  `;
};
