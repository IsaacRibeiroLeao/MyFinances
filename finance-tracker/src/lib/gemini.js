export async function analyzeExpenses(expenses) {
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0
    }
    acc[expense.category] += expense.amount
    return acc
  }, {})

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  
  const prompt = `You are a financial advisor. Analyze the following monthly expenses and provide specific, actionable recommendations to reduce spending:

Total Monthly Spending: $${totalSpending.toFixed(2)}

Expenses by Category:
${Object.entries(expensesByCategory)
  .map(([category, amount]) => `- ${category}: $${amount.toFixed(2)} (${((amount / totalSpending) * 100).toFixed(1)}%)`)
  .join('\n')}

Please provide:
1. Top 3 categories where spending can be reduced
2. Specific actionable tips for each category
3. Estimated monthly savings if recommendations are followed
4. Any patterns or concerns you notice

Keep your response concise and practical.`

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  // Use v1beta endpoint with gemini-pro (stable model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      // If API is not available, provide basic insights
      if (errorData.error?.code === 404) {
        return generateBasicInsights(expensesByCategory, totalSpending)
      }
      
      throw new Error(`API Error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    // Extract text from response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    }
    
    throw new Error('Unexpected response format')
  } catch (error) {
    console.error('Gemini API Error:', error)
    
    // Always fallback to basic insights if API fails
    return generateBasicInsights(expensesByCategory, totalSpending)
  }
}

function generateBasicInsights(expensesByCategory, totalSpending) {
  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  let insights = `📊 **Spending Analysis** (Total: $${totalSpending.toFixed(2)})\n\n`
  insights += `**Top 3 Spending Categories:**\n\n`
  
  sortedCategories.forEach(([category, amount], index) => {
    const percentage = ((amount / totalSpending) * 100).toFixed(1)
    insights += `${index + 1}. **${category}**: $${amount.toFixed(2)} (${percentage}%)\n`
    
    // Basic recommendations
    if (category === 'Food & Dining' && percentage > 20) {
      insights += `   💡 Consider meal planning and cooking at home to reduce dining expenses.\n\n`
    } else if (category === 'Shopping' && percentage > 15) {
      insights += `   💡 Try the 24-hour rule: wait a day before making non-essential purchases.\n\n`
    } else if (category === 'Entertainment' && percentage > 10) {
      insights += `   💡 Look for free or low-cost entertainment alternatives.\n\n`
    } else if (category === 'Transportation' && percentage > 15) {
      insights += `   💡 Consider carpooling, public transit, or combining trips to save on fuel.\n\n`
    } else {
      insights += `   💡 Review this category for potential savings opportunities.\n\n`
    }
  })
  
  insights += `\n**General Recommendations:**\n`
  insights += `• Set a budget for each category and track progress\n`
  insights += `• Look for subscription services you can cancel\n`
  insights += `• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n\n`
  insights += `_Note: AI-powered insights are temporarily unavailable. These are basic recommendations. The Gemini API may need a few minutes to activate after being enabled._`
  
  return insights
}
