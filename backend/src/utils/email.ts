import nodemailer, { Transporter } from "nodemailer";
import { config } from "@config/environment";
import { logger } from "./logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    // Use a test SMTP service or configure your real SMTP
    if (config.NODE_ENV === "development") {
      // For development, you can use Ethereal Email or skip verification
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: "ethereal.user@ethereal.email",
          pass: "verysecret",
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    // Only verify in production to avoid development crashes
    if (config.NODE_ENV === "production") {
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error("SMTP connection error:", error);
        } else {
          logger.info("SMTP server is ready to take our messages");
        }
      });
    } else {
      logger.info("Email service initialized in development mode");
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In development, just log the email instead of sending
      if (config.NODE_ENV === "development") {
        logger.info("📧 Email would be sent:", {
          to: options.to,
          subject: options.subject,
          preview: options.html.substring(0, 100) + "...",
        });
        return true;
      }

      const mailOptions = {
        from: `"Cartel Detection Platform" <${config.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email sent successfully to ${options.to}:`,
        result.messageId
      );
      return true;
    } catch (error) {
      logger.error("Failed to send email:", error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string
  ): Promise<boolean> {
    const verificationUrl = `${config.CORS_ORIGIN}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to Cartel Detection Platform!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with us. Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Best regards,<br>
              The Cartel Detection Platform Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "Verify Your Email - Cartel Detection Platform",
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string
  ): Promise<boolean> {
    const resetUrl = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Password Reset Request</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Best regards,<br>
              The Cartel Detection Platform Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "Reset Your Password - Cartel Detection Platform",
      html,
    });
  }

  async sendSearchCompleteEmail(
    email: string,
    searchId: string,
    firstName: string
  ): Promise<boolean> {
    const dashboardUrl = `${config.CORS_ORIGIN}/dashboard/search/${searchId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Search Results Ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Your Search Results Are Ready!</h2>
            <p>Hi ${firstName},</p>
            <p>Your cartel detection search has been completed successfully. Click the button below to view your results:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Results</a>
            </div>
            <p>You can also access your results anytime from your dashboard.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Best regards,<br>
              The Cartel Detection Platform Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "Search Results Ready - Cartel Detection Platform",
      html,
    });
  }

  async sendReportReadyEmail(
    email: string,
    reportId: string,
    firstName: string
  ): Promise<boolean> {
    const reportUrl = `${config.CORS_ORIGIN}/dashboard/reports/${reportId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Report Ready</title>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #059669;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 10px;
            }
            .title {
              color: #059669;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #059669;
              color: white;
              padding: 14px 35px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #047857;
            }
            .info-box {
              background-color: #f0fdf4;
              border-left: 4px solid #059669;
              padding: 15px;
              margin: 20px 0;
            }
            .features-list {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .features-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .features-list li {
              margin-bottom: 8px;
            }
            .footer {
              border-top: 1px solid #eee;
              margin-top: 30px;
              padding-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">📊 Cartel Detection Platform</div>
              <h2 class="title">Your Report is Ready! 🎉</h2>
            </div>
            
            <p>Hi <strong>${firstName}</strong>,</p>
            
            <p>Great news! Your cartel detection report has been generated successfully and is ready for download.</p>
            
            <div class="info-box">
              <strong>📋 Report ID:</strong> ${reportId}<br>
              <strong>⏰ Generated:</strong> ${new Date().toLocaleString()}<br>
              <strong>📍 Status:</strong> Completed
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reportUrl}" class="button">📥 View & Download Report</a>
            </div>
            
            <div class="features-list">
              <h3 style="margin-top: 0; color: #059669;">What's included in your report:</h3>
              <ul>
                <li>📈 <strong>Executive Summary</strong> - Key findings and risk assessment</li>
                <li>🔍 <strong>Detailed Analysis</strong> - Comprehensive cartel detection results</li>
                <li>📊 <strong>Visual Charts</strong> - Data visualizations and risk indicators</li>
                <li>💡 <strong>Recommendations</strong> - Actionable next steps and guidance</li>
                <li>📋 <strong>Raw Data</strong> - Technical details and supporting information</li>
              </ul>
            </div>
            
            <p>You can access your report anytime from your dashboard. The report includes:</p>
            <ul>
              <li>Risk score analysis and interpretation</li>
              <li>Market behavior patterns and indicators</li>
              <li>Regulatory compliance recommendations</li>
              <li>Downloadable formats (PDF, HTML, JSON)</li>
            </ul>
            
            <div class="info-box">
              <strong>🔒 Privacy Notice:</strong> Your report is securely stored and only accessible to you. 
              You can share it with specific individuals if needed using our secure sharing feature.
            </div>
            
            <p>If you have any questions about your report or need assistance interpreting the results, 
            please don't hesitate to contact our support team.</p>
            
            <p>Need help? Check out our <a href="${
              config.CORS_ORIGIN
            }/help" style="color: #059669;">Help Center</a> 
            or <a href="${
              config.CORS_ORIGIN
            }/contact" style="color: #059669;">contact support</a>.</p>
            
            <div class="footer">
              <p>
                Best regards,<br>
                <strong>The Cartel Detection Platform Team</strong>
              </p>
              <p>
                This email was sent because you requested a cartel detection report. 
                If you didn't request this report, please <a href="${
                  config.CORS_ORIGIN
                }/contact" style="color: #059669;">contact us</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "📊 Your Cartel Detection Report is Ready - Download Now",
      html,
    });
  }

  async sendReportSharedEmail(
    email: string,
    reportId: string,
    reportTitle: string,
    sharedByName: string
  ): Promise<boolean> {
    const reportUrl = `${config.CORS_ORIGIN}/shared/reports/${reportId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Report Shared With You</title>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              color: #2563eb;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 14px 35px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .report-info {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .shared-by {
              background-color: #eff6ff;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
            }
            .warning-box {
              background-color: #fef3c7;
              border-left: 4px solid #d97706;
              padding: 15px;
              margin: 20px 0;
            }
            .access-info {
              background-color: #f0fdf4;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              border-top: 1px solid #eee;
              margin-top: 30px;
              padding-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">📊 Cartel Detection Platform</div>
              <h2 class="title">Report Shared With You 🤝</h2>
            </div>
            
            <p>Hello,</p>
            
            <div class="shared-by">
              <strong>📤 Shared by:</strong> ${sharedByName}<br>
              <strong>📅 Shared on:</strong> ${new Date().toLocaleDateString()}<br>
              <strong>⏰ Time:</strong> ${new Date().toLocaleTimeString()}
            </div>
            
            <p><strong>${sharedByName}</strong> has shared a cartel detection report with you:</p>
            
            <div class="report-info">
              <h3 style="margin-top: 0; color: #2563eb;">📋 "${reportTitle}"</h3>
              <p><strong>Report ID:</strong> ${reportId}</p>
              <p>This report contains detailed cartel detection analysis including risk assessments, 
              market behavior patterns, and regulatory compliance recommendations.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reportUrl}" class="button">🔍 View Report</a>
            </div>
            
            <div class="access-info">
              <h3 style="margin-top: 0; color: #059669;">🔐 Access Information:</h3>
              <ul style="margin: 10px 0;">
                <li>✅ You have <strong>view and download</strong> access to this report</li>
                <li>⏰ Access expires in <strong>7 days</strong> from the share date</li>
                <li>🔒 This is a secure, time-limited link</li>
                <li>📱 Works on desktop and mobile devices</li>
              </ul>
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Important:</strong> This shared access will expire on 
              <strong>${new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}</strong>. 
              Make sure to review the report before the expiration date.
            </div>
            
            <h3 style="color: #2563eb;">What you can do with this report:</h3>
            <ul>
              <li>📖 <strong>View online</strong> - Read the complete analysis in your browser</li>
              <li>⬇️ <strong>Download</strong> - Save as PDF, HTML, or JSON format</li>
              <li>📊 <strong>Review charts</strong> - Interactive data visualizations</li>
              <li>📋 <strong>Access raw data</strong> - Technical details and methodology</li>
            </ul>
            
            <p>If you're new to cartel detection reports, here's what you'll find:</p>
            <ul>
              <li><strong>Executive Summary:</strong> Key findings and overall risk assessment</li>
              <li><strong>Detailed Analysis:</strong> Comprehensive breakdown of indicators</li>
              <li><strong>Recommendations:</strong> Actionable next steps and guidance</li>
              <li><strong>Supporting Data:</strong> Technical details and evidence</li>
            </ul>
            
            <p>Questions about the report content? Contact <strong>${sharedByName}</strong> who shared this with you.</p>
            
            <p>Need technical support? Visit our <a href="${
              config.CORS_ORIGIN
            }/help" style="color: #2563eb;">Help Center</a> 
            or <a href="${
              config.CORS_ORIGIN
            }/contact" style="color: #2563eb;">contact our support team</a>.</p>
            
            <div class="footer">
              <p>
                Best regards,<br>
                <strong>The Cartel Detection Platform Team</strong>
              </p>
              <p>
                This email was sent because someone shared a report with your email address. 
                If you believe this was sent in error, please <a href="${
                  config.CORS_ORIGIN
                }/contact" style="color: #2563eb;">contact us</a>.
              </p>
              <p>
                <a href="${
                  config.CORS_ORIGIN
                }/privacy" style="color: #2563eb;">Privacy Policy</a> | 
                <a href="${
                  config.CORS_ORIGIN
                }/terms" style="color: #2563eb;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `📊 "${reportTitle}" - Report Shared by ${sharedByName}`,
      html,
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export const emailService = new EmailService();
