import { useEffect, useState } from "react";

const functionDescription = `
Call this function to give the user performance cues and feedback throughout the conversation.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_roleplay_cue",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            cueType: {
              type: "string",
              description: "Type of cue (e.g., 'body_language', 'tone', 'pacing', 'vocabulary')",
              enum: ["body_language", "tone", "pacing", "vocabulary"]
            },
            suggestion: {
              type: "string",
              description: "Specific suggestion for improvement"
            },
            importance: {
              type: "string",
              description: "Priority level of the cue",
              enum: ["high", "medium", "low"]
            }
          },
          required: ["cueType", "suggestion", "importance"]
        }
      }
    ],
    tool_choice: "auto"
  }
};

function CueDisplay({ functionCallOutput }) {
  const { cueType, suggestion, importance } = JSON.parse(functionCallOutput.arguments);

  const importanceColors = {
    high: "bg-red-100 border-red-300",
    medium: "bg-yellow-100 border-yellow-300",
    low: "bg-green-100 border-green-300"
  };

  const cueTypeIcons = {
    body_language: "👤",
    tone: "🗣️",
    pacing: "⏱️",
    vocabulary: "📚"
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={`p-4 rounded-lg border ${importanceColors[importance]}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{cueTypeIcons[cueType]}</span>
          <h3 className="text-lg font-semibold capitalize">
            {cueType.replace('_', ' ')}
          </h3>
        </div>
        <p className="text-gray-700">{suggestion}</p>
      </div>
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}

export default function RolePlayCue({
  isSessionActive,
  sendClientEvent,
  events
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

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
          output.name === "display_roleplay_cue"
        ) {
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                  acknowledge the cue and encourage the user to try implementing 
                  the suggestion in their next response
                `
              }
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Hint</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <CueDisplay functionCallOutput={functionCallOutput} />
          ) : (
            <p></p>
          )
        ) : (
          <p>As you practice, you will see real-time cues here</p>
        )}
      </div>
    </section>
  );
}
