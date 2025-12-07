const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAvxCcRm366b_LQGwoWcPggUwZrj3q-2UM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function analyzeBusinessData(data) {
  try {
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

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const result = await response.json();
    if (!result.candidates || !result.candidates[0]) {
      throw new Error('Invalid response');
    }
    
    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      insights: [
        'Sales data is being tracked successfully',
        'Customer base is growing steadily',
        'Product inventory is well maintained'
      ],
      recommendations: [
        'Continue monitoring sales trends',
        'Focus on customer retention strategies'
      ]
    };
  }
}
