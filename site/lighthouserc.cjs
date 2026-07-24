module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx serve site/dist -l 4321',
      startServerReadyPattern: 'Accepting connections',
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/team',
        'http://localhost:4321/stream/toronto',
        'http://localhost:4321/join',
      ],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
