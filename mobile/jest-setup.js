/* global jest, require */
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));

require('react-native-reanimated').setUpTests();
