import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../generated/prisma/client';

function parseDatabaseUrl(url: string) {
  const withoutProtocol = url.replace(/^sqlserver:\/\//, '');
  const [hostPort, ...paramParts] = withoutProtocol.split(';');
  const [server, port] = hostPort.split(':');

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [key, ...valueParts] = part.split('=');
    params[key.trim().toLowerCase()] = valueParts.join('=').trim();
  }

  return {
    server,
    port: parseInt(port || '1433', 10),
    database: params['database'],
    user: params['user'],
    password: params['password'],
    options: {
      encrypt: params['encrypt'] === 'true',
      trustServerCertificate: params['trustservercertificate'] === 'true',
    },
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const config = parseDatabaseUrl(process.env['DATABASE_URL']!);
    const adapter = new PrismaMssql(config);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.warn(
        'Could not connect to database: ' + (error as Error).message,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
