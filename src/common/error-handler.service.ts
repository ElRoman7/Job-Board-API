import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DB_ERROR_CODES } from './constants/db-errors.constants';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger('ErrorHandlerService');
  private readonly dbErrors = DB_ERROR_CODES;

  handleDBException(error: any) {
    switch (error.code) {
      case this.dbErrors.UNIQUE_CONSTRAINT:
        throw new BadRequestException(error.detail);
  
      case this.dbErrors.NOT_NULL_CONSTRAINT:
        throw new BadRequestException(
          `Column ${error.column} in table ${error.table} must not be null`,
        );
  
      case this.dbErrors.FOREIGN_KEY_VIOLATION:
        throw new BadRequestException(
          `Foreign key violation: ${error.detail || 'Invalid reference'}`,
        );
  
      case this.dbErrors.CHECK_VIOLATION:
        throw new BadRequestException(
          `Check constraint violated: ${error.detail}`,
        );
  
      default:
        this.logger.error(error);
        throw new InternalServerErrorException(
          'Unexpected error, Check server logs',
        );
    }
  }
  
}
