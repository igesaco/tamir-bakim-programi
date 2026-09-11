import { recognizeText } from 'expo-mlkit-ocr';
import parser from './documentOcrParser.cjs';

export const valueAfterLabel = parser.valueAfterLabel;

export async function readDocument(uri, kind) {
  const result = await recognizeText(uri);
  return parser.parseResult(result, kind);
}
