const { revealVariants, staggerVariants } = require('./motionVariants');

test('reveal hides with offset when motion allowed', () => {
  const v = revealVariants(false, 24);
  expect(v.hidden).toEqual({ opacity: 0, y: 24 });
  expect(v.visible.opacity).toBe(1);
  expect(v.visible.y).toBe(0);
});

test('reveal is static (no offset, instant) under reduced motion', () => {
  const v = revealVariants(true, 24);
  expect(v.hidden).toEqual({ opacity: 1, y: 0 });
  expect(v.visible).toEqual({ opacity: 1, y: 0 });
});

test('stagger delay is zero under reduced motion', () => {
  expect(staggerVariants(true, 0.1).visible.transition.staggerChildren).toBe(0);
  expect(staggerVariants(false, 0.1).visible.transition.staggerChildren).toBe(0.1);
});
