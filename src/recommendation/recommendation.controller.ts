import { Controller, Post } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  // @Get()
  // @Auth(ValidRoles.candidate)
  // async getRecommendations(
  //   @Request() req,
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ) {
  //   const userId = req.user.id;
  //   return this.recommendationService.getPersonalizedRecommendations(userId, limit);
  // }

  @Post('refresh-model')
  async refreshModel() {
    await this.recommendationService.refreshModel();
    return { message: 'Modelo reentrenado exitosamente' };
  }
}
