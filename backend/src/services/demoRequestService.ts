import { DemoRequest, IDemoRequest } from "@models/DemoRequest";
import { User } from "@models/User";
import { logger } from "@utils/logger";
import { emailService } from "@utils/email";

interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface CreateDemoRequestData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phoneNumber?: string;
  companySize?: string;
  industry?: string;
  message?: string;
}

interface UpdateDemoRequestData {
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  signupAllowed?: boolean;
}

export class DemoRequestService {
  async createDemoRequest(
    data: CreateDemoRequestData
  ): Promise<ServiceResponse> {
    try {
      // Check if demo request already exists for this email
      const existingRequest = await DemoRequest.findOne({ email: data.email });

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return {
            success: false,
            message: "A demo request for this email is already pending review.",
          };
        } else if (existingRequest.status === "approved") {
          return {
            success: false,
            message:
              "You have already been approved for a demo. Please check your email for signup instructions.",
          };
        }
      }

      const demoRequest = new DemoRequest(data);
      await demoRequest.save();

      // Send notification email to admins
      await this.sendAdminNotificationEmail(demoRequest);

      // Send confirmation email to user
      await this.sendUserConfirmationEmail(demoRequest);

      logger.info(`Demo request created successfully for ${data.email}`);

      return {
        success: true,
        message:
          "Demo request submitted successfully. We'll review your request and get back to you soon.",
        data: {
          id: demoRequest._id,
          email: demoRequest.email,
          status: demoRequest.status,
        },
      };
    } catch (error: any) {
      logger.error("Create demo request error:", error);

      if (error.code === 11000) {
        return {
          success: false,
          message: "A demo request for this email already exists.",
        };
      }

      return {
        success: false,
        message: "Failed to submit demo request. Please try again.",
      };
    }
  }

  async getAllDemoRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const filter: any = {};

      if (status && ["pending", "approved", "rejected"].includes(status)) {
        filter.status = status;
      }

      const [requests, total] = await Promise.all([
        DemoRequest.find(filter)
          .populate("approvedBy", "firstName lastName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DemoRequest.countDocuments(filter),
      ]);

      return {
        success: true,
        message: "Demo requests retrieved successfully",
        data: {
          demoRequests: requests,
          pagination: {
            page: page,
            pages: Math.ceil(total / limit),
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      logger.error("Get demo requests error:", error);
      return {
        success: false,
        message: "Failed to retrieve demo requests",
      };
    }
  }

  async getDemoRequestById(id: string): Promise<ServiceResponse> {
    try {
      const request = await DemoRequest.findById(id)
        .populate("approvedBy", "firstName lastName email")
        .lean();

      if (!request) {
        return {
          success: false,
          message: "Demo request not found",
        };
      }

      return {
        success: true,
        message: "Demo request retrieved successfully",
        data: request,
      };
    } catch (error) {
      logger.error("Get demo request by ID error:", error);
      return {
        success: false,
        message: "Failed to retrieve demo request",
      };
    }
  }

  async updateDemoRequest(
    id: string,
    data: UpdateDemoRequestData,
    adminId: string
  ): Promise<ServiceResponse> {
    try {
      const request = await DemoRequest.findById(id);

      if (!request) {
        return {
          success: false,
          message: "Demo request not found",
        };
      }

      const updateData: any = { ...data };

      if (data.status === "approved") {
        updateData.approvedBy = adminId;
        updateData.approvedAt = new Date();
        updateData.signupAllowed = true;
        updateData.rejectedAt = undefined;
        updateData.rejectionReason = undefined;
      } else if (data.status === "rejected") {
        updateData.rejectedAt = new Date();
        updateData.signupAllowed = false;
        updateData.approvedBy = undefined;
        updateData.approvedAt = undefined;
      }

      const updatedRequest = await DemoRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate("approvedBy", "firstName lastName email");

      // Send email notification based on status
      if (data.status === "approved" && updatedRequest) {
        await this.sendApprovalEmail(updatedRequest);
      } else if (data.status === "rejected" && updatedRequest) {
        await this.sendRejectionEmail(updatedRequest);
      }

      logger.info(
        `Demo request ${id} updated to ${data.status} by admin ${adminId}`
      );

      return {
        success: true,
        message: `Demo request ${data.status} successfully`,
        data: updatedRequest,
      };
    } catch (error) {
      logger.error("Update demo request error:", error);
      return {
        success: false,
        message: "Failed to update demo request",
      };
    }
  }

  async checkEmailEligibility(email: string): Promise<ServiceResponse> {
    try {
      const request = await DemoRequest.findOne({ email });

      if (!request) {
        return {
          success: false,
          message:
            "No demo request found for this email. Please request a demo first.",
        };
      }

      if (request.status !== "approved" || !request.signupAllowed) {
        return {
          success: false,
          message:
            "Your demo request is not yet approved. Please wait for admin approval.",
        };
      }

      if (request.hasSignedUp) {
        return {
          success: false,
          message: "This email has already been used to create an account.",
        };
      }

      return {
        success: true,
        message: "Email is eligible for signup",
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          company: request.company,
        },
      };
    } catch (error) {
      logger.error("Check email eligibility error:", error);
      return {
        success: false,
        message: "Failed to check email eligibility",
      };
    }
  }

  async markAsSignedUp(email: string): Promise<ServiceResponse> {
    try {
      logger.info(`Marking demo request as signed up for email: ${email}`);

      const demoRequest = await DemoRequest.findOneAndUpdate(
        {
          email: email.toLowerCase(),
          status: "approved",
          signupAllowed: true,
        },
        {
          hasSignedUp: true,
          $currentDate: { lastModified: true },
        },
        { new: true }
      );

      if (!demoRequest) {
        return {
          success: false,
          message: "No approved demo request found for this email",
        };
      }

      logger.info(`Demo request marked as signed up: ${email}`);

      return {
        success: true,
        message: "Demo request marked as signed up successfully",
        data: demoRequest,
      };
    } catch (error) {
      logger.error("Mark as signed up service error:", error);
      return {
        success: false,
        message: "Failed to mark demo request as signed up",
      };
    }
  }

  private async sendAdminNotificationEmail(
    request: IDemoRequest
  ): Promise<void> {
    try {
      // Get all admin users
      const admins = await User.find({ role: "admin" }).select(
        "email firstName lastName"
      );

      for (const admin of admins) {
        await emailService.sendEmail({
          to: admin.email,
          subject: `New Demo Request - ${request.company}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Demo Request Received</h2>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details:</h3>
                <p><strong>Name:</strong> ${request.firstName} ${
            request.lastName
          }</p>
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Company:</strong> ${request.company}</p>
                <p><strong>Job Title:</strong> ${request.jobTitle}</p>
                ${
                  request.phoneNumber
                    ? `<p><strong>Phone:</strong> ${request.phoneNumber}</p>`
                    : ""
                }
                ${
                  request.companySize
                    ? `<p><strong>Company Size:</strong> ${request.companySize}</p>`
                    : ""
                }
                ${
                  request.industry
                    ? `<p><strong>Industry:</strong> ${request.industry}</p>`
                    : ""
                }
                ${
                  request.message
                    ? `<p><strong>Message:</strong><br>${request.message}</p>`
                    : ""
                }
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="http://localhost:3000/admin/demo-requests" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Demo Request
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                This is an automated notification from LexProbe Demo Request System.
              </p>
            </div>
          `,
        });
      }
    } catch (error) {
      logger.error("Send admin notification email error:", error);
    }
  }

  private async sendUserConfirmationEmail(
    request: IDemoRequest
  ): Promise<void> {
    try {
      await emailService.sendEmail({
        to: request.email,
        subject: "Demo Request Received - LexProbe",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank You for Your Demo Request!</h2>
            
            <p>Dear ${request.firstName},</p>
            
            <p>We have received your demo request for LexProbe's AI-Powered Legal Analytics platform. Our team will review your request and get back to you within 24-48 hours.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="margin-top: 0; color: #2563eb;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Our team will review your demo request</li>
                <li>You'll receive an approval email with access instructions</li>
                <li>You'll be able to sign up and explore our platform</li>
                <li>We'll schedule a personalized demo session</li>
              </ul>
            </div>

            <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            The LexProbe Team</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated confirmation from LexProbe. Please do not reply to this email.
            </p>
          </div>
        `,
      });
    } catch (error) {
      logger.error("Send user confirmation email error:", error);
    }
  }

  private async sendApprovalEmail(request: IDemoRequest): Promise<void> {
    try {
      await emailService.sendEmail({
        to: request.email,
        subject: "Demo Request Approved - Welcome to LexProbe!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Congratulations! Your Demo Request Has Been Approved</h2>
            
            <p>Dear ${request.firstName},</p>
            
            <p>Great news! Your demo request for LexProbe has been approved. You now have access to our AI-Powered Legal Analytics platform.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #10b981;">Get Started Now</h3>
              <p>Click the button below to create your account and start exploring:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:3000/auth/signup?email=${encodeURIComponent(
                  request.email
                )}" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
                  Create Account
                </a>
                <a href="http://localhost:3000/auth/login" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
                  Login
                </a>
              </div>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>Important:</strong> This approval is specifically for the email address ${
                  request.email
                }. 
                Please use this email when creating your account.
              </p>
            </div>

            <h3>What You Can Do:</h3>
            <ul>
              <li>Perform advanced cartel detection analysis</li>
              <li>Access AI-powered legal intelligence</li>
              <li>Generate comprehensive compliance reports</li>
              <li>Monitor market behavior in real-time</li>
            </ul>

            <p>If you need any assistance getting started, our support team is here to help.</p>
            
            <p>Welcome to LexProbe!<br>
            The LexProbe Team</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This approval is valid for 30 days. Please create your account soon.
            </p>
          </div>
        `,
      });
    } catch (error) {
      logger.error("Send approval email error:", error);
    }
  }

  private async sendRejectionEmail(request: IDemoRequest): Promise<void> {
    try {
      await emailService.sendEmail({
        to: request.email,
        subject: "Demo Request Update - LexProbe",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Demo Request Update</h2>
            
            <p>Dear ${request.firstName},</p>
            
            <p>Thank you for your interest in LexProbe. After reviewing your demo request, we're unable to approve access at this time.</p>
            
            ${
              request.rejectionReason
                ? `
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0; color: #dc2626;">Reason:</h3>
              <p style="margin: 0;">${request.rejectionReason}</p>
            </div>
            `
                : ""
            }

            <p>If you believe this decision was made in error or if your circumstances have changed, please feel free to submit a new demo request or contact our team directly.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/demo" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Request Demo Again
              </a>
            </div>

            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br>
            The LexProbe Team</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              If you have questions, please contact our support team.
            </p>
          </div>
        `,
      });
    } catch (error) {
      logger.error("Send rejection email error:", error);
    }
  }
}

export const demoRequestService = new DemoRequestService();
