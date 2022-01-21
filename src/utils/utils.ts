/**
 * @param input The template string
 * @param find The substring to find within the input string
 * @param replace The value to replace the find string with
 * @returns The input string with the find values replaced by the replace value
 */
export function replaceAll(input: string, find: string, replace: string): string {
  if (find === replace) {
    return input;
  }
  let processing = input;
  let output = '';
  let idx = input.indexOf(find);
  while (idx >= 0) {
    output += processing.substring(0, idx) + replace;
    processing = processing.substring(idx + find.length);
    idx = processing.indexOf(find);
  }
  output += processing;
  return output;
}
