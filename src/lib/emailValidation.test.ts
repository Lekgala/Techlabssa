import assert from 'node:assert/strict';
import test from 'node:test';
import { getEmailValidationError, isValidEmail } from './emailValidation.ts';

test('accepts ordinary and South African email domains', () => {
  assert.equal(isValidEmail('student@example.com'), true);
  assert.equal(isValidEmail('name.surname@example.co.za'), true);
});

test('gives a useful error for malformed addresses', () => {
  assert.equal(getEmailValidationError('student example.com'), 'Email address cannot contain spaces.');
  assert.equal(getEmailValidationError('student@example'), 'Enter a valid email domain, for example gmail.com or outlook.com.');
});

test('suggests corrections for common provider domain typos', () => {
  assert.equal(getEmailValidationError('student@outlook.cm'), 'Did you mean student@outlook.com?');
  assert.equal(getEmailValidationError('student@gmial.com'), 'Did you mean student@gmail.com?');
});
