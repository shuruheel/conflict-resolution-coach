import { render, screen, waitFor } from '@testing-library/react';
import { Summary } from './Summary';

describe('Summary Component', () => {
  it('should handle empty events array', () => {
    render(<Summary events={[]} isSessionActive={true} sendClientEvent={() => {}} />);
    expect(screen.queryByText('Session Summary')).not.toBeInTheDocument();
  });

  // Add more test cases...
}); 