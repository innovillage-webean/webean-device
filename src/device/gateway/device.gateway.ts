import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DeviceService } from "../device.service";
import { LiveDetectionRecord } from "../interface/device";


@WebSocketGateway({cors: { origin: '*' }, namespace: '/device'})
export class DeviceGateway implements OnGatewayConnection, OnGatewayDisconnect{
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(DeviceGateway.name)

    private detectorSocket: Socket | null = null;

    constructor(private readonly deviceService:DeviceService){}

    handleConnection(client: Socket) {
        this.logger.log(`Frontend terhubung: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        if(this.detectorSocket?.id === client.id){
            this.detectorSocket = null;
            this.logger.warn(`Detector Raspi interrupted`);

            await this.deviceService.stopSession();

            this.server.to('dashboard').emit('detector_status', {
                connected:false,
                timestamp: new Date().toISOString(),
            })
        }
        this.logger.log(`Frontend terputus: ${client.id}`)
    };

    @SubscribeMessage('register')
    async handleRegister(@ConnectedSocket() client:Socket, @MessageBody() data: {role: 'detector' | 'dashboard'}){
       if(data.role === 'detector'){
        this.detectorSocket = client;
        client.join('detector');
        this.logger.log(`Signed detector: ${client.id}`)

        await this.deviceService.StartSession();

        this.server.to('dashboard').emit('detector_status', {
            connected:true,
            timestamp: new Date().toISOString()
        })
        return { type: 'registered', role:'detector'}
       };

       if(data.role === 'dashboard'){
        client.join('dashboard');
        this.logger.log(`Signed Dashboard: ${client.id}`);

        client.emit('session_stats', this.deviceService.getLiveSession());
        client.emit('detector_status', {
            connected: !!this.detectorSocket,
            timestamp: new Date().toISOString(),
        });

        return { type: 'registered', role: 'dashboard' }
       }

    };

    @SubscribeMessage('detection')
    handleDetection(
        @MessageBody() data: { baik: number, cacat:number},
        @ConnectedSocket() client:Socket,
    ){
        if(client.id !== this.detectorSocket?.id){
            this.logger.warn(`Unauthorized detector dari: ${client.id}`)
            return;
        };

        const record = this.deviceService.recordDetection(
            data.baik ?? 0,
            data.cacat ?? 0
        );

        this.logger.log(
            `Baik: ${record.baik} | Cacat: ${record.cacat} | ` +
            `Total Baik: ${record.totalBaik} | Total Cacat: ${record.totalCacat}`
        );

        this.server.to('dashboard').emit('detection', record);

    }

    @SubscribeMessage('get_live')
    handleGetLive(@ConnectedSocket() client:Socket){
        client.emit('session_stats', this.deviceService.getLiveSession());
    }

    @SubscribeMessage('ping')
    handlePing(){
        return{ type: 'pong' , timestamp: new Date().toISOString()}
    };

    broadcastDetection(record: LiveDetectionRecord) {
    this.server.to('dashboard').emit('detection', record);
  }

  broadcastDetectorStatus(connected: boolean) {
    this.server.to('dashboard').emit('detector_status', {
      connected,
      timestamp: new Date().toISOString(),
    });
  }
}