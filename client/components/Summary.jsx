import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

function SummarySection({ title, items, icon }) {
  if (!items?.length) return null;
  
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
  const [summaryData, setSummaryData] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState(null);

  const parseSessionTranscript = useCallback((events) => {
    try {
      return events
        .reverse() // Process events in chronological order
        .filter(event => 
          event.type === "conversation.item.create" || 
          (event.type === "response.done" && event.response?.output)
        )
        .map(event => {
          try {
            if (event.type === "conversation.item.create") {
              const content = event.item?.content?.[0]?.text || '';
              return {
                role: event.item?.role || 'user',
                content: content
              };
            }
            
            const textOutputs = event.response?.output
              ?.filter(output => output?.type === "text" && output?.text)
              ?.map(output => output.text) || [];
            
            return {
              role: "assistant",
              content: textOutputs.join(" ")
            };
          } catch (error) {
            console.error('Error processing event:', error, event);
            return null;
          }
        })
        .filter(Boolean); // Remove any null entries
    } catch (error) {
      console.error('Error parsing transcript:', error);
      throw new Error('Failed to parse conversation transcript');
    }
  }, []);

  const parseSummaryResponse = useCallback((summaryText) => {
    const sections = {
      strengths: [],
      areas_for_improvement: [],
      personalized_suggestions: [],
      overall_progress: ''
    };

    try {
      // Split into sections and clean up any extra whitespace
      const parts = summaryText
        .split(/\n\n+/)
        .map(part => part.trim())
        .filter(Boolean);
      
      parts.forEach(part => {
        const trimmedPart = part.trim();
        
        const processBulletPoints = (text, headerToRemove) => 
          text
            .replace(headerToRemove, '')
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.startsWith('-'))
            .map(item => item.slice(1).trim())
            .filter(Boolean);

        if (trimmedPart.startsWith('STRENGTHS:')) {
          sections.strengths = processBulletPoints(trimmedPart, 'STRENGTHS:');
        } 
        else if (trimmedPart.startsWith('AREAS FOR IMPROVEMENT:')) {
          sections.areas_for_improvement = processBulletPoints(trimmedPart, 'AREAS FOR IMPROVEMENT:');
        }
        else if (trimmedPart.startsWith('PERSONALIZED SUGGESTIONS:')) {
          sections.personalized_suggestions = processBulletPoints(trimmedPart, 'PERSONALIZED SUGGESTIONS:');
        }
        else if (trimmedPart.startsWith('OVERALL PROGRESS:')) {
          sections.overall_progress = trimmedPart
            .replace('OVERALL PROGRESS:', '')
            .trim();
        }
      });

      return sections;
    } catch (error) {
      console.error('Error parsing summary sections:', error);
      throw new Error('Failed to parse summary sections');
    }
  }, []);

  useEffect(() => {
    if (!events?.length) return;

    const mostRecentEvent = events[0];
    
    if (mostRecentEvent?.type === "session.ended") {
      setError(null);
      setIsGeneratingSummary(true);
      
      try {
        const sessionTranscript = parseSessionTranscript(events);

        sendClientEvent({
          type: "conversation.item.create",
          item: {
            role: "user",
            content: [{
              type: "text",
              text: `Please analyze our conversation and generate a summary using EXACTLY the following format. Do not deviate from this format or add any additional text:

STRENGTHS:
- [specific strength demonstrated in the conversation]
- [specific strength demonstrated in the conversation]
- [specific strength demonstrated in the conversation]

AREAS FOR IMPROVEMENT:
- [specific area needing improvement]
- [specific area needing improvement]
- [specific area needing improvement]

PERSONALIZED SUGGESTIONS:
- [specific, actionable suggestion tied to an area of improvement]
- [specific, actionable suggestion tied to an area of improvement]
- [specific, actionable suggestion tied to an area of improvement]

OVERALL PROGRESS:
[Single paragraph assessment of overall progress, focusing on growth and potential]

Here's our conversation transcript:
${JSON.stringify(sessionTranscript)}`
            }]
          }
        });
      } catch (error) {
        setError('Failed to process conversation history. Please try again.');
        setIsGeneratingSummary(false);
      }
    }

    if (
      mostRecentEvent?.type === "response.done" &&
      mostRecentEvent.response?.output
    ) {
      try {
        const summaryText = mostRecentEvent.response.output
          .filter(output => output?.type === "text")
          .map(output => output.text)
          .join("\n\n");

        const sections = parseSummaryResponse(summaryText);

        // Validate the parsed data
        const isValid = 
          sections.strengths.length >= 2 &&
          sections.areas_for_improvement.length >= 2 &&
          sections.personalized_suggestions.length >= 2 &&
          sections.overall_progress.length > 20; // Ensure meaningful paragraph

        if (isValid) {
          setSummaryData(sections);
          setIsGeneratingSummary(false);
          setError(null);
        } else {
          throw new Error('Invalid summary format: Missing required sections');
        }
      } catch (error) {
        console.error('Summary generation error:', error);
        setError('Failed to generate summary. Please try again.');
        setIsGeneratingSummary(false);
      }
    }
  }, [events, sendClientEvent, parseSessionTranscript, parseSummaryResponse]);

  useEffect(() => {
    if (!isSessionActive) {
      setSummaryData(null);
      setError(null);
      setIsGeneratingSummary(false);
    }
  }, [isSessionActive]);

  if (isGeneratingSummary) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-gray-500">Generating session summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

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
          {summaryData.overall_progress && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>📈</span> Overall Progress
              </h3>
              <p className="text-gray-700">{summaryData.overall_progress}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
