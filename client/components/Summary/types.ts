export interface SummarySection {
  title: string;
  items: string[];
  icon: string;
}

export interface SummaryData {
  strengths: string[];
  areas_for_improvement: string[];
  personalized_suggestions: string[];
  overall_progress: string;
}

export interface SummaryProps {
  isSessionActive: boolean;
  sendClientEvent: (event: any) => void;
  events: any[];
} 