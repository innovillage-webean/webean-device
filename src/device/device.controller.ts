// src/device/device.controller.ts
import {
  Controller, Post, Body, HttpCode, HttpStatus, Logger,
  Get,
  Query,
  Param,
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


  @Post('session/stop')
  @HttpCode(HttpStatus.OK)
  async stopSession() {
    await this.deviceService.stopSession();
    this.logger.log('Sesi dihentikan via HTTP.');
 
    this.deviceGateway.broadcastDetectorStatus(false);

    return { message: 'Sesi berhasil dihentikan.' };
  }

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

  @Get("sessions")
  getSessions(
    @Query('page') page='1',
    @Query('limit') limit='10',
  ){
    return this.deviceService.getSessions(Number(page), Number(limit));
  }

  @Get("sessions/:sessionId/records")
  getSessionRecord(
    @Param('sessionId') sessionId:string,
    @Query('limit') limit='100',
  ){
    return this.deviceService.getSessionsRecord(sessionId, Number(limit));
  }

  @Get('mothly')
  getMonthHistory(
    @Query('limit') limit='12',
  ){
    return this.deviceService.getMonthlyHistory(Number(limit));
  }

  @Get('monthly/current')
  getCurrentMonth(){
    return this.deviceService.getCurrentMonthSummary();
  }

  @Get('monthly/:year')
  getByYear(@Param('year') year:string){
    return this.deviceService.getYearSummary(Number(year));
  }
}