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
    if (error.code === this.dbErrors.UNIQUE_CONSTRAINT)
      throw new BadRequestException(error.detail);

    if (error.code === this.dbErrors.NOT_NULL_CONSTRAINT)
      throw new BadRequestException(
        `Column ${error.column} in table ${error.table} must not be null`,
      );

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, Check server logs',
    );
  }
}
