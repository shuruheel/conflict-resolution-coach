import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from "recharts"

const functionDescription = `
Call this function after every user interaction to update the user's conflict resolution ratings.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "update_conflict_ratings",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            compassion: {
              type: "number",
              description: "Rating for compassion (0-100)",
            },
            consideration: {
              type: "number",
              description: "Rating for consideration (0-100)",
            },
            clarity: {
              type: "number",
              description: "Rating for clarity (0-100)",
            },
            constructiveness: {
              type: "number",
              description: "Rating for constructiveness (0-100)",
            },
            consistency: {
              type: "number",
              description: "Rating for consistency (0-100)",
            },
            overall: {
              type: "number",
              description: "Overall conflict resolution rating (0-100)",
            },
          },
          required: ["compassion", "consideration", "clarity", "constructiveness", "consistency", "overall"],
        },
      },
    ],
    tool_choice: "auto",
    instructions: `You are a Conflict Resolution Coach. Begin by warmly welcoming the user and explaining that you'll help them practice conflict resolution skills through role-play.
    
    After each user interaction, call update_conflict_ratings to update the user's ratings for the following conflict resolutionskills:
    - Compassion: Ability to show empathy and understanding
    - Consideration: Respect for different perspectives
    - Clarity: Clear and effective communication
    - Constructiveness: Focus on solutions and positive outcomes
    - Consistency: Maintaining a balanced approach throughout
    
    Provide gentle guidance when needed, always maintaining a supportive coaching tone.
    `
  },
};

export default function ConflictRatingsPanel({ isSessionActive, sendClientEvent, events }) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [ratings, setRatings] = useState({
    compassion: 0,
    consideration: 0,
    clarity: 0,
    constructiveness: 0,
    consistency: 0,
    overall: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "update_conflict_ratings") {
          setIsUpdating(true);
          const newRatings = JSON.parse(output.arguments);
          setRatings(newRatings);
          setTimeout(() => setIsUpdating(false), 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setRatings({
        compassion: 0,
        consideration: 0,
        clarity: 0,
        constructiveness: 0,
        consistency: 0,
        overall: 0
      });
    }
  }, [isSessionActive]);

  function ProgressBar({ label, value, description }) {
    return (
      <div className="mt-4 mb-4">
        <div className="flex justify-between mb-1">
          <div>
            <p className="text-sm font-bold">{label}</p>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
          <p className="text-sm font-bold">{value}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              isUpdating ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  }

  const skillDescriptions = {
    compassion: "Showing empathy and understanding",
    consideration: "Respecting different perspectives",
    clarity: "Communicating clearly and effectively",
    constructiveness: "Finding positive solutions",
    consistency: "Maintaining balance throughout"
  };

  const radarData = [
    { subject: "Compassion", value: ratings.compassion },
    { subject: "Consideration", value: ratings.consideration },
    { subject: "Clarity", value: ratings.clarity },
    { subject: "Constructiveness", value: ratings.constructiveness },
    { subject: "Consistency", value: ratings.consistency },
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-6">
        <Card className={`${isUpdating ? 'ring-2 ring-green-500' : ''}`}>
          <CardHeader>
            <CardTitle></CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="You"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 