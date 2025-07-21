
export const parseIpInput = (rawInput: string): string[] => {
  const lines = rawInput
    .split(/[\n,; ]+/) // Split by newlines, commas, semicolons, or spaces
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Return unique values
  return [...new Set(lines)];
};
