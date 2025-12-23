import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    const qrCodeImage = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
    return qrCodeImage;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

export const generateQRCodeCanvas = async (data, canvasElement) => {
  try {
    await QRCode.toCanvas(canvasElement, data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
  } catch (err) {
    console.error('Error generating QR code on canvas:', err);
    throw err;
  }
};
