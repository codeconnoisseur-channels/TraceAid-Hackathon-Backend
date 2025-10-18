const watermark = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754353355/watermark_fdbzah.png";
const logo = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754353355/logo_v2s6ow.png";
const linkedIn = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/linkedIn_ggxxm4.png";
const instagram = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433533/instagram_p8byzw.png";
const facebook = "https://res.cloudinary.com/dbzzkaa97/image/upload/v1754433532/facebook_rjeokq.png";

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
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: transparent;">
    <center style="width: 100%;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width: 600px; margin: 0 auto; background-color: transparent; font-family: Poppins, sans-serif;">
        
        <!-- Logo -->
        <tr>
          <td style="margin: 0px">
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
              style="display: inline-block; background-color: #4e26ebff; color: #ffffff; font-size: 18px; 
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
          <td style="height: 5px; background-color: #4e26ebff;"></td>
        </tr>
      </table>
    </center>
  </body>
</html>
`;
};
