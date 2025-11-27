// src/components/RosterCheckpointQRList.tsx
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Card from './Card';
import Text from './Text';
import Button from './Button';
import { useTheme } from '../context/ThemeContext';

/** row returned from GET /api/roster-shifts/:id/check-points */
export interface ShiftCheckpoint {
  checkpoint_id: number;
  checkpoint_number: number;
  checkpoint_name: string;
  qr_token: string;
  /** you can extend this interface later if you need more fields */
}

interface Props {
  /** list straight from the backend */
  checkpoints: ShiftCheckpoint[];
  /**
   * Optional prefix for the QR payload.
   *   - ''  → QR value is just the raw token
   *   - 'https://your-domain.com/scan?token=' → value becomes that URL + token
   */
  baseScanUrl?: string;
}

const RosterCheckpointQRList: React.FC<Props> = ({
  checkpoints,
  baseScanUrl = '',
}) => {
  const { theme } = useTheme();

  /** download the canvas as a PNG so supervisors can print / share */
  const downloadPng = (token: string, label: string) => {
    const canvas = document.getElementById(`qr-${token}`) as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `${label}.png`;
    a.click();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {checkpoints.map((cp) => {
        const value = baseScanUrl
          ? `${baseScanUrl.replace(/\/$/, '')}${cp.qr_token}`
          : cp.qr_token;

        const label =
          cp.checkpoint_name?.trim()?.length
            ? `${cp.checkpoint_number}. ${cp.checkpoint_name}`
            : `Checkpoint ${cp.checkpoint_number}`;

        return (
          <Card
            key={cp.checkpoint_id}
            className="flex flex-col items-center space-y-3"
            padding="p-5"
          >
            <Text isHeading size="lg" newLine className="text-center">
              {label}
            </Text>

            {/* QR canvas – id used for download */}
            <QRCodeCanvas
                id={`qr-${cp.qr_token}`}
                value={value}
                size={160}
                level="M"
                bgColor={theme === 'dark' ? '#1F2937' : '#FFFFFF'}
                fgColor={theme === 'dark' ? '#F9FAFB' : '#000000'}
            />

            <Button
              icon="download"
              size="small"
              color="view"
              onClick={() => downloadPng(cp.qr_token, label.replace(/\s+/g, '_'))}
            >
              Download PNG
            </Button>
          </Card>
        );
      })}
    </div>
  );
};

export default RosterCheckpointQRList;
