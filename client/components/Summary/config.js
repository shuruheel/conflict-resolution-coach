export const SUMMARY_CONFIG = {
  sections: {
    strengths: {
      title: "Your Strengths",
      icon: "💪",
      minItems: 2
    },
    areas_for_improvement: {
      title: "Areas for Growth",
      icon: "🎯",
      minItems: 2
    },
    personalized_suggestions: {
      title: "Personalized Suggestions",
      icon: "💡",
      minItems: 2
    },
    overall_progress: {
      title: "Overall Progress",
      icon: "📈",
      minLength: 20
    }
  },
  promptTemplate: `Please analyze our conversation...` // Move the template here
}; 