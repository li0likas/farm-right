import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client'
//import { taskMiddleware } from './prisma.middleware';

@Injectable()
export class PrismaService extends PrismaClient{
    constructor(config: ConfigService){
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL')
                },
            },
        });

        //this.$use(taskMiddleware());
    }
}
