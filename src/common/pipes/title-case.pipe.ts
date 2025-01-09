import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TitleCasePipe implements PipeTransform {
  transform(value: string, metadata?: ArgumentMetadata): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
