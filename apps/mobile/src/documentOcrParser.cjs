function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function linesFrom(result) {
  if (Array.isArray(result?.blocks)) {
    return result.blocks.flatMap(block =>
      Array.isArray(block?.lines)
        ? block.lines.map(line => clean(line?.text)).filter(Boolean)
        : clean(block?.text)
          ? [clean(block.text)]
          : [],
    );
  }
  const text = typeof result === 'string' ? result : result?.text || '';
  return String(text).split(/\r?\n/).map(clean).filter(Boolean);
}

function valueAfterLabel(lines, labels) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const upper = line.toLocaleUpperCase('tr-TR');
    for (const label of labels) {
      const heading = upper.split(/[:：]/)[0].trim();
      if (heading === label || heading.split(/\s*\/\s*/).includes(label)) {
        const inline = clean(line.split(/[:：]/).slice(1).join(':'));
        if (inline && inline.toLocaleUpperCase('tr-TR') !== label) return inline;
        if (lines[index + 1]) return clean(lines[index + 1]);
      }
    }
  }
  return '';
}

function parseResult(result, kind) {
  const lines = linesFrom(result);
  const joined = lines.join(' ');
  if (kind === 'identity') {
    return {
      rawLines: lines,
      firstName: valueAfterLabel(lines, ['ADI', 'GIVEN NAME', 'GIVEN NAMES']),
      lastName: valueAfterLabel(lines, ['SOYADI', 'SURNAME']),
    };
  }
  const plateMatch = joined.toLocaleUpperCase('tr-TR').match(/\b\d{2}\s?[A-ZÇĞİÖŞÜ]{1,3}\s?\d{2,4}\b/);
  const vinMatch = joined.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  const yearMatch = joined.match(/\b(19\d{2}|20\d{2})\b/);
  return {
    rawLines: lines,
    plate: plateMatch ? plateMatch[0].replace(/\s+/g, ' ').trim() : '',
    vin: vinMatch ? vinMatch[0] : '',
    modelYear: valueAfterLabel(lines, ['MODEL YILI', 'MODEL YEAR']) || (yearMatch ? yearMatch[0] : ''),
    brand: valueAfterLabel(lines, ['MARKASI', 'MARKA', 'MAKE']),
    model: valueAfterLabel(lines, ['TİCARİ ADI', 'TICARI ADI', 'TİPİ', 'TIPI', 'MODEL']),
  };
}

module.exports = { linesFrom, valueAfterLabel, parseResult };
