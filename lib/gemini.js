import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

export async function generateNotificationMessage(type, context) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompts = {
      account_blocked: `Generate a professional, empathetic notification message (max 150 chars) for a business whose CRM account has been blocked. Reason: ${context.reason || 'Payment pending'}. Include that they should contact support.`,
      
      account_unblocked: `Generate a welcoming notification message (max 150 chars) for a business whose CRM account has been unblocked. Make it positive and encouraging.`,
      
      settings_updated: `Generate a brief notification message (max 150 chars) informing that admin has updated their ${context.settingType || 'account'} settings. Be professional and reassuring.`,
      
      admin_message: `Generate a professional notification title (max 100 chars) for this admin message: "${context.message}". Make it concise and attention-grabbing.`,
      
      payment_reminder: `Generate a polite payment reminder notification (max 150 chars) for quarterly maintenance fee of ₹${context.amount || 2999}. Due date: ${context.dueDate || 'soon'}. Be professional but friendly.`,
      
      system_update: `Generate a brief system update notification (max 150 chars) about: ${context.updateInfo || 'system improvements'}. Be informative and positive.`
    };

    const prompt = prompts[type] || prompts.admin_message;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().replace(/['"]/g, '');
    
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback messages
    const fallbacks = {
      account_blocked: `Your account has been temporarily blocked. Please contact support to resolve this issue.`,
      account_unblocked: `Great news! Your account has been reactivated. Welcome back!`,
      settings_updated: `Admin has updated your account settings. Changes are now active.`,
      admin_message: context.message || 'You have a new message from admin.',
      payment_reminder: `Quarterly maintenance payment of ₹${context.amount || 2999} is due. Please complete payment to continue service.`,
      system_update: `System has been updated with new improvements and features.`
    };
    
    return fallbacks[type] || fallbacks.admin_message;
  }
}
