import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusPanel from './StatusPanel.jsx';

describe('StatusPanel', () => {
  it('renders a loading state with a spinner', () => {
    render(<StatusPanel state="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  });

  it('renders an empty state with the configured message', () => {
    render(<StatusPanel state="empty" emptyMessage="No participants yet." />);
    expect(screen.getByText('No participants yet.')).toBeVisible();
  });

  it('renders an error state with an alert role and error message', () => {
    render(<StatusPanel state="error" errorMessage="Could not load participants." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load participants.');
  });

  it('renders children when state is ready', () => {
    render(
      <StatusPanel state="ready">
        <p data-testid="child-content">Real content here</p>
      </StatusPanel>
    );
    expect(screen.getByTestId('child-content')).toBeVisible();
  });
});
