function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function upper(value) {
  return clean(value).toLocaleUpperCase('tr-TR');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const vehicleLabels = [
  'PLAKA', 'PLATE', 'PLATE NUMBER',
  'MARKASI', 'MARKA', 'MAKE',
  'TİCARİ ADI', 'TICARI ADI', 'COMMERCIAL NAME',
  'TİPİ', 'TIPI', 'TYPE',
  'MODEL YILI', 'MODEL YEAR',
  'ŞASİ NO', 'SASI NO', 'ŞASİ NUMARASI', 'SASI NUMARASI', 'VIN',
];

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
  const orderedLabels = [...labels].sort((a, b) => b.length - a.length);
  for (let index = 0; index < lines.length; index += 1) {
    const line = clean(lines[index]);
    const upperLine = upper(line);
    for (const label of orderedLabels) {
      const heading = upperLine.split(/[:：]/)[0].trim();
      if (heading === label || heading.split(/\s*\/\s*/).includes(label)) {
        const inline = clean(line.split(/[:：]/).slice(1).join(':'));
        if (inline && inline.toLocaleUpperCase('tr-TR') !== label) return inline;
        const next = nextFieldValue(lines, index);
        if (next) return next;
      }

      // ML Kit sometimes drops the colon and returns "MARKASI TOYOTA".
      const labelPattern = new RegExp(`^${escapeRegExp(label)}(?:\\s*\\/\\s*[A-ZÇĞİÖŞÜ ]+)?(?:\\s*[:：=\\-]\\s*|\\s+)(.+)$`, 'iu');
      const withoutCode = line.replace(/^\s*(?:\([A-ZÇĞİÖŞÜ](?:[.\s]?\d)?\)|[A-ZÇĞİÖŞÜ][.\s]\d)\s*/iu, '');
      if (vehicleLabels.some(known => known.length > label.length && new RegExp(`^${escapeRegExp(known)}(?:\\s|[:：=\\-])`, 'iu').test(withoutCode))) continue;
      const inlineMatch = withoutCode.match(labelPattern);
      if (inlineMatch?.[1]) {
        const candidate = clean(inlineMatch[1]);
        if (candidate && !isFieldHeading(candidate)) return candidate;
      }
    }
  }
  return '';
}

function isFieldHeading(value) {
  const normalized = upper(value)
    .replace(/^\s*(?:\([A-ZÇĞİÖŞÜ](?:[.\s]?\d)?\)|[A-ZÇĞİÖŞÜ][.\s]\d)\s*/u, '')
    .replace(/[:：=\-]+$/u, '')
    .trim();
  return vehicleLabels.some(label => normalized === label || normalized.split(/\s*\/\s*/).includes(label));
}

function nextFieldValue(lines, index) {
  for (let offset = 1; offset <= 2; offset += 1) {
    const candidate = clean(lines[index + offset]);
    if (!candidate) continue;
    if (isFieldHeading(candidate) || /^\(?[A-ZÇĞİÖŞÜ](?:[.\s]?\d)?\)?$/u.test(candidate)) continue;
    return candidate;
  }
  return '';
}

function stripLabels(value, labels) {
  let candidate = clean(value).replace(/^[:：=\-\s]+/u, '');
  for (const label of [...labels].sort((a, b) => b.length - a.length)) {
    candidate = candidate.replace(new RegExp(`^${escapeRegExp(label)}(?:\\s*\\/\\s*[A-ZÇĞİÖŞÜ ]+)?(?:\\s*[:：=\\-]\\s*|\\s+|$)`, 'iu'), '');
  }
  return clean(candidate);
}

function valueAfterFieldCode(lines, code, labels = []) {
  const flexibleCode = escapeRegExp(code).replace('\\.', '[.\\s]?');
  const codePattern = new RegExp(`(?:^|\\s|\\()${flexibleCode}(?:\\)|\\s|[:：=\\-]|$)`, 'iu');
  for (let index = 0; index < lines.length; index += 1) {
    const line = clean(lines[index]);
    const match = codePattern.exec(line);
    if (!match) continue;
    const rest = stripLabels(line.slice(match.index + match[0].length), labels);
    if (rest && !isFieldHeading(rest)) return rest;
    const next = nextFieldValue(lines, index);
    if (next) return stripLabels(next, labels);
  }
  return '';
}

function normalizePlate(value) {
  const match = upper(value).match(/\b\d{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*\d{2,4}\b/u);
  if (!match) return '';
  return match[0].replace(/\s+/g, ' ').trim();
}

function normalizeVin(value) {
  const compact = upper(value).replace(/[^A-HJ-NPR-Z0-9]/g, '');
  const match = compact.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : '';
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
  const plateValue = valueAfterLabel(lines, ['PLAKA', 'PLATE NUMBER', 'PLATE'])
    || valueAfterFieldCode(lines, 'A', ['PLAKA', 'PLATE NUMBER', 'PLATE'])
    || joined;
  const vinValue = valueAfterLabel(lines, ['ŞASİ NO', 'SASI NO', 'ŞASİ NUMARASI', 'SASI NUMARASI', 'VIN'])
    || valueAfterFieldCode(lines, 'E', ['ŞASİ NO', 'SASI NO', 'ŞASİ NUMARASI', 'SASI NUMARASI', 'VIN'])
    || joined;
  const yearMatch = joined.match(/\b(19\d{2}|20\d{2})\b/);
  const brand = valueAfterLabel(lines, ['MARKASI', 'MARKA', 'MAKE'])
    || valueAfterFieldCode(lines, 'D.1', ['MARKASI', 'MARKA', 'MAKE']);
  const commercialName = valueAfterLabel(lines, ['TİCARİ ADI', 'TICARI ADI', 'COMMERCIAL NAME'])
    || valueAfterFieldCode(lines, 'D.3', ['TİCARİ ADI', 'TICARI ADI', 'COMMERCIAL NAME']);
  const vehicleType = valueAfterLabel(lines, ['TİPİ', 'TIPI', 'TYPE'])
    || valueAfterFieldCode(lines, 'D.2', ['TİPİ', 'TIPI', 'TYPE']);
  const codedYear = valueAfterFieldCode(lines, 'D.4', ['MODEL YILI', 'MODEL YEAR']);
  return {
    rawLines: lines,
    plate: normalizePlate(plateValue) || normalizePlate(joined),
    vin: normalizeVin(vinValue) || normalizeVin(joined),
    modelYear: (valueAfterLabel(lines, ['MODEL YILI', 'MODEL YEAR']) || codedYear).match(/\b(19\d{2}|20\d{2})\b/)?.[0]
      || (yearMatch ? yearMatch[0] : ''),
    brand: clean(brand),
    model: clean(commercialName || vehicleType || valueAfterLabel(lines, ['MODEL'])),
  };
}

module.exports = { linesFrom, valueAfterLabel, valueAfterFieldCode, parseResult };
