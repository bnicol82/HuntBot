import { fireEvent, render, screen } from '@testing-library/react-native';

import { Compass } from '../Compass';

describe('Compass', () => {
  it('shows true heading with the 16-point label', async () => {
    await render(
      <Compass heading={{ deg: 314.6, accuracy: 3 }} headingUp={false} onToggle={() => {}} />,
    );
    expect(screen.getByText('315° NW')).toBeTruthy();
    expect(screen.getByText('North up · true')).toBeTruthy();
  });

  it('flags low calibration and shows a dash with no heading', async () => {
    const { rerender } = await render(
      <Compass heading={{ deg: 10, accuracy: 1 }} headingUp onToggle={() => {}} />,
    );
    expect(screen.getByText('Heading up · true · calibrate')).toBeTruthy();
    await rerender(<Compass heading={null} headingUp onToggle={() => {}} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('toggles orientation on press', async () => {
    const onToggle = jest.fn();
    await render(<Compass heading={null} headingUp={false} onToggle={onToggle} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
