import { fireEvent, render, screen } from '@testing-library/react-native';

import { AgeQuestion } from '../AgeQuestion';

describe('AgeQuestion', () => {
  it.each([
    ['18 or older', 'adult'],
    ['13 to 17', 'teen'],
    ['Under 13', 'under_13'],
  ])('maps "%s" to %s', async (label, bracket) => {
    const onAnswer = jest.fn();
    await render(<AgeQuestion onAnswer={onAnswer} />);
    await fireEvent.press(screen.getByText(label));
    expect(onAnswer).toHaveBeenCalledWith(bracket);
  });
});
