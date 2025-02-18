beforeAll(() => {
  // Increase timeout for all tests
  jest.setTimeout(10000);
});

afterAll(() => {
  // Clean up any hanging handles
  jest.clearAllTimers();
});
