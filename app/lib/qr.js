import QRCode from 'qrcode';
import Jimp from 'jimp';
import path from 'path';

const ACCENT_COLOR = '#66cd7a';
const LOGO_PATH = path.join(process.cwd(), 'public', 'qr_logo.png');

/**
 * Generates a QR code PNG (as base64 data URL) for the given URL,
 * with the accent color #66cd7a and the Intranet from the Trenches logo
 * (public/qr_logo.png) composited in the center.
 * Uses high error correction to allow logo overlay.
 */
export async function generateQrCodeWithLogo(url) {
  try {
    // Generate QR code as PNG buffer with accent color and high ECC for logo
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
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
      console.warn('Could not load qr_logo.png, using plain QR:', logoErr.message);
      // fallback to plain QR
      const plainBase64 = await qrImage.getBase64Async(Jimp.MIME_PNG);
      return plainBase64;
    }

    // Resize logo to ~22% of QR width (good balance for scannability)
    const qrSize = qrImage.getWidth();
    const logoSize = Math.floor(qrSize * 0.22);
    logoImage.resize(logoSize, logoSize);

    // Center the logo
    const x = Math.floor((qrSize - logoSize) / 2);
    const y = Math.floor((qrSize - logoSize) / 2);

    // Composite (logo on top of QR)
    qrImage.composite(logoImage, x, y);

    // Return as data URL (base64 PNG)
    const base64 = await qrImage.getBase64Async(Jimp.MIME_PNG);
    return base64;
  } catch (err) {
    console.error('QR code generation failed:', err);
    // Last resort fallback: plain QR with accent color
    try {
      const fallbackBuffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
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
