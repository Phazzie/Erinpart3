/**
 * Type declarations for the QRCode library loaded from CDN.
 * This makes the global QRCode object properly typed.
 */

import * as QRCodeModule from 'qrcode';

declare global {
  /**
   * Global QRCode object provided by the CDN script.
   * See: https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js
   */
  const QRCode: typeof QRCodeModule;
}
