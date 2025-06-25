import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid not configured, email not sent");
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendDailyCalorieReminder(userEmail: string, userName: string = 'there'): Promise<boolean> {
  const subject = "📱 Daily Calorie Check-in - Calonik.ai";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎯 Time for Your Daily Check-in!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          It's time to log your daily calories and exercise! Consistency is key to reaching your health goals.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Quick Actions:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>🍽️ Log your meals and snacks</li>
            <li>💪 Record your exercises</li>
            <li>⚖️ Update your current weight</li>
            <li>📊 Check your progress</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🚀 Open Calonik.ai
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          Stay consistent, stay healthy! 💪<br>
          <em>© 2025 Calonik.ai by Kikonic Tech</em>
        </p>
      </div>
    </div>
  `;

  const text = `Hi ${userName},

It's time for your daily calorie and exercise check-in! 

Quick Actions:
- Log your meals and snacks
- Record your exercises  
- Update your current weight
- Check your progress

Open Calonik.ai: https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev

Stay consistent, stay healthy!
© 2025 Calonik.ai by Kikonic Tech`;

  return await sendEmail({
    to: userEmail,
    from: 'noreply@calonik.ai',
    subject,
    text,
    html
  });
}

export async function sendWeightGoalCongratulations(
  userEmail: string, 
  userName: string = 'there',
  currentWeight: number,
  previousWeight: number,
  goalType: 'lose' | 'gain' | 'maintain'
): Promise<boolean> {
  let congratsMessage = '';
  let emoji = '🎉';
  
  if (goalType === 'lose' && currentWeight < previousWeight) {
    congratsMessage = `Great job! You've lost ${(previousWeight - currentWeight).toFixed(1)} kg since yesterday. Keep up the excellent work!`;
    emoji = '🎯';
  } else if (goalType === 'gain' && currentWeight > previousWeight) {
    congratsMessage = `Excellent progress! You've gained ${(currentWeight - previousWeight).toFixed(1)} kg since yesterday. You're on track!`;
    emoji = '💪';
  } else if (goalType === 'maintain' && Math.abs(currentWeight - previousWeight) <= 0.2) {
    congratsMessage = `Perfect! You're maintaining your weight beautifully. Only ${Math.abs(currentWeight - previousWeight).toFixed(1)} kg difference from yesterday.`;
    emoji = '⚖️';
  } else {
    // Still encouraging even if not perfectly on track
    congratsMessage = `Thanks for logging your weight! Remember, daily fluctuations are normal. Stay consistent with your goals.`;
    emoji = '💚';
  }

  const subject = `${emoji} Weight Update - You're Doing Great!`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${emoji} Weight Progress Update</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; text-align: center;">
          <h3 style="margin-top: 0; color: #11998e;">📊 Today's Weight: ${currentWeight} kg</h3>
          <p style="font-size: 16px; margin: 15px 0; font-weight: bold; color: #333;">
            ${congratsMessage}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          <strong>Remember:</strong> Consistency is more important than daily perfection. Keep logging your progress!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev" 
             style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📱 View Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          Keep up the great work! 🌟<br>
          <em>© 2025 Calonik.ai by Kikonic Tech</em>
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    from: 'noreply@calonik.ai',
    subject,
    html
  });
}