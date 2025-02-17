import { Module } from '@nestjs/common';
import { ErrorHandlerService } from './error-handler.service';
import { EncoderService } from './encoder.service';

@Module({
  providers: [ErrorHandlerService, EncoderService],
  exports: [ErrorHandlerService, EncoderService],
})
export class CommonModule {}
