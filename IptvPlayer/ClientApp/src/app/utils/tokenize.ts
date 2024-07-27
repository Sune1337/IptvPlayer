export function tokenize(text: string): Array<string> {
  const words = new Set<string>();
  const segmenter = new Intl.Segmenter(navigator.language, { granularity: 'word' });
  for (let { index, segment, isWordLike } of segmenter.segment(text)) {
    if (isWordLike) {
      let word = segment.toLowerCase();
      words.add(word);
    }
  }

  return Array.from(words);
}
