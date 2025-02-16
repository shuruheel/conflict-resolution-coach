import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const functionDescription = `
Call this function to generate a summary of the user's conflict resolution session.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "generate_session_summary",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            strengths: {
              type: "array",
              description: "List of user's demonstrated strengths",
              items: {
                type: "string"
              }
            },
            areas_for_improvement: {
              type: "array",
              description: "List of areas where the user can improve",
              items: {
                type: "string"
              }
            },
            personalized_suggestions: {
              type: "array",
              description: "Specific, actionable suggestions for improvement",
              items: {
                type: "string"
              }
            },
            overall_progress: {
              type: "string",
              description: "Brief description of overall progress and growth"
            }
          },
          required: ["strengths", "areas_for_improvement", "personalized_suggestions", "overall_progress"]
        }
      }
    ],
    tool_choice: "auto"
  }
};

function SummarySection({ title, items, icon }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <span>{icon}</span>
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Summary({ isSessionActive, sendClientEvent, events }) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === "generate_session_summary"
        ) {
          setSummaryData(JSON.parse(output.arguments));
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setSummaryData(null);
    }
  }, [isSessionActive]);

  if (!summaryData) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
        <CardDescription>
          Here's a comprehensive review of your conflict resolution practice session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <SummarySection
            title="Your Strengths"
            items={summaryData.strengths}
            icon="💪"
          />
          <SummarySection
            title="Areas for Growth"
            items={summaryData.areas_for_improvement}
            icon="🎯"
          />
          <SummarySection
            title="Personalized Suggestions"
            items={summaryData.personalized_suggestions}
            icon="💡"
          />
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>📈</span> Overall Progress
            </h3>
            <p className="text-gray-700">{summaryData.overall_progress}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
