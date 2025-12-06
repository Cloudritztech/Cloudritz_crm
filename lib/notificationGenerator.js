import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBpCW_L7yyBxOqKLhH_wYvKqxvXqVqH-Qs');

export async function generateDailyInsights(businessData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a business intelligence assistant for a tiles and sanitary products CRM system.

Business Data Summary:
- Today's Sales: ₹${businessData.todaySales || 0}
- Weekly Sales: ₹${businessData.weeklySales || 0}
- Monthly Sales: ₹${businessData.monthlySales || 0}
- Total Customers: ${businessData.totalCustomers || 0}
- Low Stock Items: ${businessData.lowStockCount || 0}
- Pending Payments: ₹${businessData.pendingPayments || 0}
- Total Expenses: ₹${businessData.totalExpenses || 0}
- Profit Margin: ${businessData.profitMargin || 0}%

Generate 3-5 actionable business notifications in JSON format. Each notification should be concise, professional, and actionable.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Brief title (max 50 chars)",
    "message": "Detailed message (max 150 chars)",
    "type": "info|success|warning|error|insight",
    "category": "sales|inventory|customer|expense|system",
    "priority": "low|medium|high|urgent",
    "icon": "TrendingUp|AlertTriangle|Users|Package|DollarSign|Bell",
    "actionUrl": "/path",
    "actionText": "View Details"
  }
]

Focus on: sales trends, inventory alerts, customer insights, expense warnings, and growth opportunities.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const notifications = JSON.parse(jsonMatch[0]);
    return notifications;
  } catch (error) {
    console.error('AI notification generation failed:', error);
    return generateFallbackNotifications(businessData);
  }
}

function generateFallbackNotifications(data) {
  const notifications = [];
  
  if (data.todaySales > 0) {
    notifications.push({
      title: "Today's Sales Update",
      message: `You've made ₹${data.todaySales.toFixed(2)} in sales today. Keep up the great work!`,
      type: 'success',
      category: 'sales',
      priority: 'medium',
      icon: 'TrendingUp',
      actionUrl: '/invoices',
      actionText: 'View Invoices'
    });
  }
  
  if (data.lowStockCount > 0) {
    notifications.push({
      title: 'Low Stock Alert',
      message: `${data.lowStockCount} products are running low on stock. Reorder soon to avoid stockouts.`,
      type: 'warning',
      category: 'inventory',
      priority: 'high',
      icon: 'AlertTriangle',
      actionUrl: '/products?lowStock=true',
      actionText: 'View Items'
    });
  }
  
  if (data.pendingPayments > 0) {
    notifications.push({
      title: 'Pending Payments',
      message: `₹${data.pendingPayments.toFixed(2)} in pending payments. Follow up with customers.`,
      type: 'warning',
      category: 'customer',
      priority: 'high',
      icon: 'DollarSign',
      actionUrl: '/invoices?status=pending',
      actionText: 'View Pending'
    });
  }
  
  return notifications;
}

export async function generateNotificationForEvent(eventType, eventData) {
  const templates = {
    'low_stock': {
      title: 'Low Stock Alert',
      message: `${eventData.productName} is running low (${eventData.currentStock} units remaining)`,
      type: 'warning',
      category: 'inventory',
      priority: 'high',
      icon: 'Package'
    },
    'large_sale': {
      title: 'Large Sale Completed',
      message: `New invoice of ₹${eventData.amount} created for ${eventData.customerName}`,
      type: 'success',
      category: 'sales',
      priority: 'medium',
      icon: 'TrendingUp'
    },
    'new_customer': {
      title: 'New Customer Added',
      message: `${eventData.customerName} has been added to your customer list`,
      type: 'info',
      category: 'customer',
      priority: 'low',
      icon: 'Users'
    },
    'expense_alert': {
      title: 'High Expense Recorded',
      message: `Expense of ₹${eventData.amount} recorded for ${eventData.category}`,
      type: 'warning',
      category: 'expense',
      priority: 'medium',
      icon: 'AlertTriangle'
    }
  };
  
  return templates[eventType] || null;
}
