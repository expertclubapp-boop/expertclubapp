import { sanitizeActionUrl } from './src/notifications/service';

function testSanitize() {
  console.log("Running Sanitize Tests...");

  const testCases = [
    { url: '/app/community', expected: '/app/community' },
    { url: 'javascript:alert(1)', expected: '/app/today' }, // fallback
    { url: 'https://evil.com', expected: '/app/today' },
    { url: '/ranking/xyz', expected: '/ranking/xyz' },
    { url: 'badges', expected: '/badges' },
    { url: undefined, expected: '/app/today' },
    { url: '/challenges/123', expected: '/challenges/123' }
  ];

  let passed = 0;
  testCases.forEach((tc, index) => {
    const result = sanitizeActionUrl(tc.url, 'system' as any);
    if (result === tc.expected) {
      console.log(`Test ${index + 1} Passed`);
      passed++;
    } else {
      console.error(`Test ${index + 1} Failed! Expected ${tc.expected}, got ${result}`);
    }
  });

  console.log(`\nTests Passed: ${passed}/${testCases.length}`);
}

testSanitize();
