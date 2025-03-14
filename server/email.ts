import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// Configure the email transporter
export function initEmailTransporter() {
  // Check if we have the email configurations
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration not found, email notifications will be disabled');
    return;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendGiveawayConfirmation(email: string, orderID: string): Promise<boolean> {
  if (!transporter) {
    console.log('Email transporter not initialized');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@surprizely.com',
      to: email,
      subject: 'Giveaway Entry Confirmation',
      text: `Thank you for entering our giveaway! We've received your entry and will review it shortly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0097FB; text-align: center;">Thanks for Entering Our Giveaway!</h1>
          
          <p>Dear Valued Customer,</p>
          
          <p>We're excited to confirm that you've been successfully entered into our monthly giveaway drawing!</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Your Entry Details:</strong></p>
            <p>Order ID: ${orderID}</p>
            <p>Entry Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Each month, we randomly select winners for various prizes including:</p>
          
          <ul>
            <li>$100 Amazon Gift Cards</li>
            <li>Premium Products</li>
            <li>Exclusive Discounts</li>
          </ul>
          
          <p>Winners will be notified via email, so keep an eye on your inbox!</p>
          
          <p>Thank you for shopping with us!</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://suprizely.com" style="background-color: #0097FB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Continue Shopping
            </a>
          </p>
          
          <hr style="margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.<br>
            If you have any questions, please contact support@suprizely.com
          </p>
        </div>
      `,
    });
    console.log('Giveaway confirmation email sent');
    return true;
  } catch (error) {
    console.error('Failed to send giveaway confirmation email:', error);
    return false;
  }
}
