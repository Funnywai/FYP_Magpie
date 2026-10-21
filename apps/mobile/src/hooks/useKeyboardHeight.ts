import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Current software keyboard height (0 when hidden). Used by sheets and lists so inputs stay visible. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    // iOS fires "Will" early enough to animate with the keyboard; Android only has "Did".
    const [show, hide] =
      Platform.OS === 'ios' ? (['keyboardWillShow', 'keyboardWillHide'] as const) : (['keyboardDidShow', 'keyboardDidHide'] as const);
    // Stored as a number only; callers decide how to pad.
    const a = Keyboard.addListener(show, (e) => setHeight(e.endCoordinates.height));
    const b = Keyboard.addListener(hide, () => setHeight(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return height;
}
