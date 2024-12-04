import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  imports: [TypeOrmModule.forFeature([Offer])],
  exports: [TypeOrmModule, OffersService]
})
export class OffersModule {}
