import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyBasicsStep } from './PropertyBasicsStep';

// Mock Counter component
vi.mock('../../../ui/Counter', () => ({
  Counter: ({ label, value, min, max, onChange }: any) => (
    <div data-testid="counter" data-label={label}>
      <label>{label}</label>
      <div>
        <button onClick={() => onChange(Math.max(min, value - 1))}>-</button>
        <span data-testid="counter-value">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  ),
}));

// Mock useLanguage
vi.mock('../../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

const defaultFormData = {
  maxGuests: 4,
  bedrooms: 2,
  beds: 3,
  bathrooms: 2,
};

const renderPropertyBasicsStep = (formData = defaultFormData) => {
  const setFormData = vi.fn();
  const utils = render(
    <PropertyBasicsStep formData={formData} setFormData={setFormData} />
  );
  return { ...utils, setFormData };
};

describe('PropertyBasicsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render step title', () => {
      renderPropertyBasicsStep();

      expect(screen.getByText('list_prop.step3_title')).toBeInTheDocument();
    });

    it('should render Counter for max guests', () => {
      renderPropertyBasicsStep();

      // Check that the label text is present
      expect(screen.getByText('prop_form.label_max_guests')).toBeInTheDocument();
    });

    it('should render Counter for bedrooms', () => {
      renderPropertyBasicsStep();

      const bedroomsCounter = screen.getAllByTestId('counter')[1];
      expect(bedroomsCounter).toHaveAttribute('data-label', 'prop_form.label_bedrooms');
    });

    it('should render Counter for beds', () => {
      renderPropertyBasicsStep();

      const bedsCounter = screen.getAllByTestId('counter')[2];
      expect(bedsCounter).toHaveAttribute('data-label', 'prop_form.label_beds');
    });

    it('should render Counter for bathrooms', () => {
      renderPropertyBasicsStep();

      const bathroomsCounter = screen.getAllByTestId('counter')[3];
      expect(bathroomsCounter).toHaveAttribute('data-label', 'prop_form.label_bathrooms');
    });

    it('should display current values in counters', () => {
      const formData = {
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
      };
      renderPropertyBasicsStep(formData);

      const counterValues = screen.getAllByTestId('counter-value');
      expect(counterValues[0]).toHaveTextContent('6');
      expect(counterValues[1]).toHaveTextContent('3');
      expect(counterValues[2]).toHaveTextContent('4');
      expect(counterValues[3]).toHaveTextContent('2');
    });
  });

  describe('counter interactions', () => {
    it('should call setFormData when incrementing max guests', () => {
      const { setFormData } = renderPropertyBasicsStep();

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[0].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...defaultFormData,
        maxGuests: 5,
      });
    });

    it('should call setFormData when decrementing max guests', () => {
      const { setFormData } = renderPropertyBasicsStep();

      const counters = screen.getAllByTestId('counter');
      const decrementButton = counters[0].querySelector('button:first-child') as HTMLElement;
      fireEvent.click(decrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...defaultFormData,
        maxGuests: 3,
      });
    });

    it('should not decrement below minimum', () => {
      const formData = { ...defaultFormData, maxGuests: 1 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const decrementButton = counters[0].querySelector('button:first-child') as HTMLElement;
      fireEvent.click(decrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        maxGuests: 1, // Should stay at minimum
      });
    });

    it('should not increment above maximum', () => {
      const formData = { ...defaultFormData, maxGuests: 16 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[0].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        maxGuests: 16, // Should stay at maximum
      });
    });

    it('should call setFormData when incrementing bedrooms', () => {
      const { setFormData } = renderPropertyBasicsStep();

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[1].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...defaultFormData,
        bedrooms: 3,
      });
    });

    it('should allow bedrooms to be 0', () => {
      const formData = { ...defaultFormData, bedrooms: 1 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const decrementButton = counters[1].querySelector('button:first-child') as HTMLElement;
      fireEvent.click(decrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        bedrooms: 0,
      });
    });

    it('should call setFormData when incrementing beds', () => {
      const { setFormData } = renderPropertyBasicsStep();

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[2].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...defaultFormData,
        beds: 4,
      });
    });

    it('should call setFormData when incrementing bathrooms', () => {
      const { setFormData } = renderPropertyBasicsStep();

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[3].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...defaultFormData,
        bathrooms: 3,
      });
    });
  });

  describe('counter limits', () => {
    it('should enforce max guests limit of 16', () => {
      const formData = { ...defaultFormData, maxGuests: 15 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[0].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        maxGuests: 16,
      });
    });

    it('should enforce bedrooms limit of 10', () => {
      const formData = { ...defaultFormData, bedrooms: 10 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[1].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        bedrooms: 10,
      });
    });

    it('should enforce beds limit of 20', () => {
      const formData = { ...defaultFormData, beds: 20 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[2].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        beds: 20,
      });
    });

    it('should enforce bathrooms limit of 10', () => {
      const formData = { ...defaultFormData, bathrooms: 10 };
      const { setFormData } = renderPropertyBasicsStep(formData);

      const counters = screen.getAllByTestId('counter');
      const incrementButton = counters[3].querySelector('button:last-child') as HTMLElement;
      fireEvent.click(incrementButton);

      expect(setFormData).toHaveBeenCalledWith({
        ...formData,
        bathrooms: 10,
      });
    });
  });

  describe('layout', () => {
    it('should have proper spacing classes', () => {
      renderPropertyBasicsStep();

      const container = screen.getByText('list_prop.step3_title').parentElement;
      expect(container).toHaveClass('space-y-6');
    });

    it('should wrap counters in max-w-md container', () => {
      renderPropertyBasicsStep();

      const countersContainer = screen.getAllByTestId('counter')[0].parentElement;
      expect(countersContainer).toHaveClass('max-w-md');
    });
  });
});
