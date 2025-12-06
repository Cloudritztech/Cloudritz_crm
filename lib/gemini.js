const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAvxCcRm366b_LQGwoWcPggUwZrj3q-2UM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function analyzeBusinessData(data) {
  const prompt = `Analyze this business data and provide insights:
Sales: ₹${data.totalSales}
Customers: ${data.totalCustomers}
Products: ${data.totalProducts}
Top Product: ${data.topProduct}
Growth: ${data.growth}%

Provide 3 key insights and 2 recommendations in JSON format:
{"insights": ["insight1", "insight2", "insight3"], "recommendations": ["rec1", "rec2"]}`;

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
}
