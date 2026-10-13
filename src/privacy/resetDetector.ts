const RESET_PHRASES = [
  'forget everything i said',
  'forget everything',
  'forget that',
  'start over',
];

function words(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
}

export function containsResetPhrase(text: string): boolean {
  const input = words(text);

  return RESET_PHRASES.some((phrase) => {
    const expected = words(phrase);
    return input.some((_, start) =>
      expected.every((word, offset) => input[start + offset] === word),
    );
  });
}
