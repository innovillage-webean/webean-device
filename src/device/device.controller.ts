// src/device/device.controller.ts
import {
  Controller, Post, Body, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { DeviceService }  from './device.service';
import { DeviceGateway }  from './gateway/device.gateway';

@Controller('device')
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(
    private readonly deviceService: DeviceService,
    private readonly deviceGateway: DeviceGateway,
  ) {}

  /**
   * POST /device/session/start
   * Dipanggil saat Raspi (model_detect.py) mulai jalan
   * Membuat sesi baru di database
   */
  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  async startSession() {
    await this.deviceService.StartSession();
    const live = this.deviceService.getLiveSession();

    this.logger.log(`Sesi dimulai via HTTP. ID: ${live.sessionId}`);

    // Beritahu frontend via WebSocket
    this.deviceGateway.broadcastDetectorStatus(true);

    return {
      sessionId : live.sessionId,
      startedAt : live.startedAt,
      message   : 'Sesi berhasil dimulai.',
    };
  }

  /**
   * POST /device/session/stop
   * Dipanggil saat Raspi selesai / dimatikan
   */
  @Post('session/stop')
  @HttpCode(HttpStatus.OK)
  async stopSession() {
    await this.deviceService.stopSession();
    this.logger.log('Sesi dihentikan via HTTP.');

    // Beritahu frontend via WebSocket
    this.deviceGateway.broadcastDetectorStatus(false);

    return { message: 'Sesi berhasil dihentikan.' };
  }

  /**
   * POST /device/detection
   * Dipanggil setiap ada deteksi dari Raspi
   * Body: { baik: number, cacat: number, sessionId: string }
   */
  @Post('detection')
  @HttpCode(HttpStatus.OK)
  handleDetection(@Body() body: { baik: number; cacat: number }) {
    const record = this.deviceService.recordDetection(
      body.baik  ?? 0,
      body.cacat ?? 0,
    );

    this.logger.log(
      `Baik: ${record.baik} | Cacat: ${record.cacat} | ` +
      `Total Baik: ${record.totalBaik} | Total Cacat: ${record.totalCacat}`,
    );

    // Broadcast ke semua frontend via WebSocket
    this.deviceGateway.broadcastDetection(record);

    return { received: true };
  }
}