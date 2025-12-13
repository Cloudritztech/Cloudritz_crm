const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAvxCcRm366b_LQGwoWcPggUwZrj3q-2UM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateBusinessAlerts(businessData) {
  const prompt = `Analyze this business data and generate critical alerts:
- Low Stock Products: ${businessData.lowStockCount}
- Pending Payments: ₹${businessData.pendingPayments}
- Today's Sales: ₹${businessData.todaySales}
- Total Customers: ${businessData.totalCustomers}
- Inventory Value: ₹${businessData.inventoryValue}

Generate 3-5 actionable alerts with priority (high/medium/low) in JSON:
[{"title": "Alert Title", "message": "Detailed messages", "priority": "high", "action": "Suggested action"}]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch (error) {
    console.error('Gemini alerts error:', error);
    return [];
  }
}
