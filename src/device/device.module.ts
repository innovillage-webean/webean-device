import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceGateway } from './gateway/device.gateway';
import { BufferService } from './service/buffer.service';
import { MonthlyService } from './service/monthly.service';
import { SessionRepository } from './repository/session.repository';
import { RecordRepository } from './repository/record.repository';
import { MonthlyRepository } from './repository/monthly.repository';
import { DatabaseModule } from '../database/database.module';
import { DeviceController } from './device.controller';

@Module({
    imports:[DatabaseModule],
    providers:[
        DeviceService,
        DeviceGateway,
        BufferService,
        MonthlyService,
        SessionRepository,
        RecordRepository,
        MonthlyRepository
    ],
    exports:[DeviceService],
    controllers: [DeviceController],
})
export class DeviceModule {}
