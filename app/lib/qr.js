import QRCode from 'qrcode';
import Jimp from 'jimp';
import path from 'path';

const ACCENT_COLOR = '#66cd7a';
// Use brand_logo.png (the main project logo) instead of dedicated qr_logo.png
// This avoids using qr_logo.png when not needed, per requirements.
const LOGO_PATH = path.join(process.cwd(), 'public', 'brand_logo.png');

/**
 * Generates a QR code PNG (as base64 data URL) for the given URL,
 * with the accent color #66cd7a and the Intranet from the Trenches logo
 * (public/brand_logo.png) composited in the center, sized to occupy
 * as much space as possible while remaining scannable.
 * Uses high error correction (H) and a white background pad under the logo
 * to maximize logo size (up to ~33% of QR area).
 */
export async function generateQrCodeWithLogo(url) {
  try {
    // Generate QR code as PNG buffer with accent color and high ECC for logo
    // Larger width for higher resolution logo integration
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: ACCENT_COLOR,
        light: '#FFFFFF'
      }
    });

    // Load images with Jimp
    const qrImage = await Jimp.read(qrBuffer);
    let logoImage;
    try {
      logoImage = await Jimp.read(LOGO_PATH);
    } catch (logoErr) {
      console.warn('Could not load brand_logo.png for QR, using plain QR:', logoErr.message);
      // fallback to plain QR (no qr_logo.png used)
      const plainBase64 = await qrImage.getBase64Async(Jimp.MIME_PNG);
      return plainBase64;
    }

    // Maximize logo size: target ~33% of QR width (aggressive but with H ECC + white pad, still scannable)
    const qrSize = qrImage.getWidth();
    const logoSize = Math.floor(qrSize * 0.33);

    // Create a white square background slightly larger than logo to clear QR modules underneath.
    // This allows the logo to occupy maximum space without data interference.
    const pad = Math.floor(logoSize * 0.08); // small padding ~8%
    const bgSize = logoSize + (pad * 2);
    const whiteBg = new Jimp(bgSize, bgSize, 0xFFFFFFFF); // pure white

    // Center positions
    const logoX = Math.floor((qrSize - logoSize) / 2);
    const logoY = Math.floor((qrSize - logoSize) / 2);
    const bgX = Math.floor((qrSize - bgSize) / 2);
    const bgY = Math.floor((qrSize - bgSize) / 2);

    // Composite white background first (clears center for max logo)
    qrImage.composite(whiteBg, bgX, bgY);

    // Resize logo to target size (preserve aspect)
    logoImage.resize(logoSize, logoSize);

    // Composite logo centered on top of white pad
    qrImage.composite(logoImage, logoX, logoY);

    // Return as data URL (base64 PNG)
    const base64 = await qrImage.getBase64Async(Jimp.MIME_PNG);
    return base64;
  } catch (err) {
    console.error('QR code generation failed:', err);
    // Last resort fallback: plain QR with accent color (no logo image)
    try {
      const fallbackBuffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 400,
        color: {
          dark: ACCENT_COLOR,
          light: '#FFFFFF'
        }
      });
      const fallbackImage = await Jimp.read(fallbackBuffer);
      return await fallbackImage.getBase64Async(Jimp.MIME_PNG);
    } catch (fbErr) {
      console.error('Fallback QR also failed:', fbErr);
      return null;
    }
  }
}
