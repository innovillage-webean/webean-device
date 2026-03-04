import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";


@Injectable()

export class MonthlyRepository {
    constructor(private readonly prisma: DatabaseService){}

    async upsert(
        data:{
            year:number;
            month:number;
            totalBaik:number;
            totalCacat:number;
            totalPanen:number;
            avgBaikPerSesi:number;
            avgCacatPerSesi:number;
            persenBaik:number;
            jumlahSesi:number;
        }
    ) {
        return this.prisma.detection_monthly.upsert(
            {
                where: { year_month: {year: data.year, month: data.month}},
                create:data,
                update:{
                    totalBaik: data.totalBaik,
                    totalCacat: data.totalCacat,
                    totalPanen: data.totalPanen,
                    avgBaikPerSesi: data.avgBaikPerSesi,
                    avgCacatPerSesi: data.avgCacatPerSesi,
                    persenBaik: data.persenBaik,
                    jumlahSesi: data.jumlahSesi,
                }
            }
        );
    };

    async findCurrentMonth() {
        const now = new Date();
        const current = await this.prisma.detection_monthly.findUnique(
            {
                where: { year_month: { year: now.getFullYear(), month: now.getMonth() + 1}}
            }
        );

        if(current) return current;

        return this.prisma.detection_monthly.findFirst(
            {
                orderBy:[{ year: 'desc' }, { month: 'desc' }]
            }
        )
    };

    async findHistory(limit: number) {
        return this.prisma.detection_monthly.findMany(
            {
                orderBy: [ {year: 'desc', month: 'desc'}],
                take:limit,
            }
        );
    };

    async findByYear(year:number){
        return this.prisma.detection_monthly.findMany({
            where: { year },
            orderBy: { month: 'asc'}
        });
    };
}