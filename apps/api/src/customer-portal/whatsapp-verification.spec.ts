import {
  createHmac,
} from 'crypto';

import {
  extractWhatsappCode,
  validWhatsappSignature,
} from './whatsapp-verification';

describe('WhatsApp verification helpers', () => {
  it('extracts only the Tamir Bakım verification format', () => {
    expect(
      extractWhatsappCode(
        'Tamir Bakım giriş doğrulaması: TB-482913',
      ),
    ).toBe('482913');
    expect(
      extractWhatsappCode('kod 482913'),
    ).toBe('');
  });

  it('checks Meta webhook signatures', () => {
    const raw = Buffer.from('{"ok":true}');
    const secret = 'test-secret';
    const signature =
      `sha256=${createHmac('sha256', secret)
        .update(raw)
        .digest('hex')}`;

    expect(
      validWhatsappSignature(
        raw,
        signature,
        secret,
      ),
    ).toBe(true);
    expect(
      validWhatsappSignature(
        raw,
        'sha256=bad',
        secret,
      ),
    ).toBe(false);
  });
});
