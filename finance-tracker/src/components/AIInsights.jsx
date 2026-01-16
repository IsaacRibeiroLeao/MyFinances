import { Sparkles, Loader2 } from 'lucide-react'

export default function AIInsights({ insights, loading, onGenerate }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Insights</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 min-h-[200px]">
        {insights ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{insights}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Click "Generate Insights" to get AI-powered spending recommendations</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>💡 AI analyzes your spending patterns and provides personalized recommendations to help you save money.</p>
      </div>
    </div>
  )
}
