import { NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback Gmail SMTP configuration
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Function to send email via Gmail SMTP as fallback
const sendViaGmail = async (to: string, subject: string, htmlContent: string) => {
  console.log("Attempting to send email via Gmail SMTP fallback...");
  
  const transporter = createGmailTransporter();
  
  const mailOptions = {
    from: `MediBot <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log("Gmail SMTP result:", result);
  return result;
};

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json();
    
    console.log("Email API received:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Message:", message);
    
    // Validate input
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error("Invalid email address:", to);
      return NextResponse.json(
        { success: false, message: "Invalid email address provided" },
        { status: 400 }
      );
    }
    
    if (!subject || !message) {
      console.error("Missing subject or message");
      return NextResponse.json(
        { success: false, message: "Subject and message are required" },
        { status: 400 }
      );
    }
    
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { success: false, message: "Email service not configured" },
        { status: 500 }
      );
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${subject}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #f4f6f8;
            font-family: Arial, sans-serif;
            color: #333;
          }
          .email-wrapper {
            width: 100%;
            height: 100%;
          }
          .email-container {
            background-color: #ffffff;
            max-width: 600px;
            width: 100%;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #4f46e5;
            padding: 40px 0;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .header img {
            width: 120px;
          }
          .icon {
            font-size: 60px;
            color: #4f46e5;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 22px;
            margin-bottom: 16px;
            color: #222;
          }
          p {
            font-size: 16px;
            margin: 8px 0;
          }
          .code {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #4f46e5;
            letter-spacing: 1px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 30px;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <table class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle">
              <div class="email-container">
                <div class="header">
                  <img src="/logo.png" alt="MediBot Logo" />
                </div>
                <div class="icon">🔒</div>
                <h1>Hi ${to?.split("@")[0] || "User"},</h1>
                <p>Here's the Remiander you requested:</p>
                <div class="code">${message}</div>
                <p>If you didn't request this, you can ignore this email or contact us.</p>
                <p>Thanks,<br />The MediBot Team</p>
                <div class="footer">
                  © ${new Date().getFullYear()} MediBot. All rights reserved.<br />
                  <a href="https://yourdomain.com/contact">Contact Us</a>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, using Gmail SMTP...");
      try {
        const result = await sendViaGmail(to, subject, htmlContent);
        return NextResponse.json({
          success: true,
          message: "Email sent successfully via Gmail SMTP",
          data: result,
        });
      } catch (gmailError) {
        console.error("Gmail SMTP error:", gmailError);
        const errorMessage = gmailError instanceof Error ? gmailError.message : String(gmailError);
        return NextResponse.json(
          { success: false, message: `Gmail SMTP error: ${errorMessage}` },
          { status: 500 }
        );
      }
    }

    console.log("Attempting to send email via Resend API...");
    
    // Use verified email from environment variables
    const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || "onboarding@resend.dev";
    console.log("Using from email:", fromEmail);
    
    try {
      const { data, error } = await resend.emails.send({
        from: `MediBot <${fromEmail}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log("Resend API Response:");
      console.log("Data:", JSON.stringify(data, null, 2));
      console.log("Error:", JSON.stringify(error, null, 2));

      if (error) {
        console.error("Resend API Error Details:", {
          message: error.message,
          name: error.name,
          type: typeof error,
          fullError: error
        });
        
        // Try Gmail as fallback
        console.log("Resend failed, trying Gmail SMTP fallback...");
        try {
          const result = await sendViaGmail(to, subject, htmlContent);
          return NextResponse.json({
            success: true,
            message: "Email sent successfully via Gmail SMTP (fallback)",
            data: result,
          });
        } catch (gmailError) {
          console.error("Gmail SMTP fallback also failed:", gmailError);
          
          // Handle specific Resend errors
          let errorMessage = "Unknown email service error";
          if (error.message) {
            errorMessage = error.message;
          } else if (error.name) {
            errorMessage = error.name;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          return NextResponse.json(
            { 
              success: false, 
              message: `Both email services failed. Resend: ${errorMessage}, Gmail: ${gmailError instanceof Error ? gmailError.message : String(gmailError)}`,
              errorType: error.name || 'ResendError'
            },
            { status: 500 }
          );
        }
      }

      console.log("Email sent successfully via Resend API");
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        data,
      });
    } catch (resendError) {
      console.error("Resend API exception:", resendError);
      
      // Try Gmail as fallback
      console.log("Resend threw exception, trying Gmail SMTP fallback...");
      try {
        const result = await sendViaGmail(to, subject, htmlContent);
        return NextResponse.json({
          success: true,
          message: "Email sent successfully via Gmail SMTP (fallback)",
          data: result,
        });
      } catch (gmailError) {
        console.error("Gmail SMTP fallback also failed:", gmailError);
        const resendErrorMsg = resendError instanceof Error ? resendError.message : String(resendError);
        const gmailErrorMsg = gmailError instanceof Error ? gmailError.message : String(gmailError);
        
        return NextResponse.json(
          { 
            success: false, 
            message: `Both email services failed. Resend: ${resendErrorMsg}, Gmail: ${gmailErrorMsg}`,
          },
          { status: 500 }
        );
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}