import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobRecommenderModel } from './job-recommender.model';
import { OffersService } from '../offers/offers.service';
import { SkillsService } from '../skills/skills.service';
import { CandidateService } from '../candidate-details/services/candidate.service';
import { RecommendationDTO } from './dto/recommendation.dto';
import { ApplicationsService } from '../job-applications/applications.service';

@Injectable()
export class RecommendationService implements OnModuleInit {
  private isModelInitialized = false;
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly recommenderModel: JobRecommenderModel,
    private readonly offersService: OffersService,
    private readonly candidatesService: CandidateService,
    private readonly skillsService: SkillsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async onModuleInit() {
    await this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      await this.recommenderModel.initializeModel();
      this.isModelInitialized = true;
      this.logger.log('Modelo inicializado correctamente');
    } catch (error) {
      this.logger.error(`Error inicializando modelo: ${error.message}`);
    }
  }

  async refreshModel(): Promise<void> {
    try {
      await this.recommenderModel.trainModel();
      this.logger.log('Modelo re-entrenado correctamente');
    } catch (error) {
      this.logger.error(`Error al re-entrenar el modelo: ${error.message}`);
    }
  }

  async getPersonalizedRecommendations(
    userId: string,
    topN = 10,
  ): Promise<RecommendationDTO[]> {
    try {
      // Garantizar que topN sea al menos 3
      topN = Math.max(3, topN);

      if (!this.isModelInitialized) {
        await this.initializeModel();
      }

      const candidate = await this.candidatesService.findOneByUserId(userId);
      if (!candidate) {
        this.logger.warn(`No se encontró candidato con userId ${userId}`);
        return [];
      }

      const [allOffers, applicationHistory] = await Promise.all([
        this.offersService.findAllActiveWithRelations(),
        this.applicationsService.getApplicationHistory(candidate.id),
      ]);

      if (allOffers.length === 0) {
        this.logger.warn('No hay ofertas disponibles para recomendar');
        return [];
      }

      const candidateSkillsEmbedding =
        await this.recommenderModel.generateRecommendationEmbedding(candidate);
      const appliedOfferIds = new Set(
        applicationHistory.map((app) => app.offer.id),
      );

      const recommendations = [];
      for (const offer of allOffers) {
        // Filtrar ofertas ya aplicadas
        if (appliedOfferIds.has(offer.id)) continue;

        // Obtener score del modelo ML
        let mlScore = await this.recommenderModel.calculateOfferMatch(
          offer,
          candidateSkillsEmbedding,
        );

        // Asegurar que mlScore sea un número válido
        if (mlScore === null || mlScore === undefined || isNaN(mlScore)) {
          this.logger.warn(
            `mlScore inválido para oferta ${offer.id}, usando valor predeterminado 0.5`,
          );
          mlScore = 0.5; // Valor neutro predeterminado
        }

        // Calcular score basado en heurísticas directamente observable
        const heuristicScore = this.calculateHeuristicScore(offer, candidate);

        // Combinar ambos scores con comprobación de validez
        const combinedScore = mlScore * 0.5 + heuristicScore * 0.5;

        recommendations.push(
          this.createRecommendationDTO(offer, candidate, combinedScore, {
            mlScore,
            heuristicScore,
          }),
        );
      }

      this.logger.log(
        `Generando ${recommendations.length} recomendaciones para userId ${userId}`,
      );

      // Ordenar por score combinado
      const sortedRecommendations = recommendations.sort(
        (a, b) => b.matchScore - a.matchScore,
      );

      // Log de las 3 principales recomendaciones para debug
      if (sortedRecommendations.length > 0) {
        const top3 = sortedRecommendations.slice(
          0,
          Math.min(3, sortedRecommendations.length),
        );
        this.logger.log(
          `Top 3 recomendaciones: ${JSON.stringify(
            top3.map((r) => ({
              title: r.title,
              score: r.matchScore,
              skills_match: r.skillsMatchPercentage,
            })),
          )}`,
        );
      }

      return sortedRecommendations.slice(0, topN);
    } catch (error) {
      this.logger.error(`Error generando recomendaciones: ${error.message}`);
      return [];
    }
  }

  /**
   * Calcula un score basado en heurísticas directamente interpretables
   */
  private calculateHeuristicScore(offer: any, candidate: any): number {
    let score = 0;
    
    // 1. Coincidencia de habilidades (factor más importante)
    const candidateSkills = new Set((candidate.skills || []).map(s => s.name.toLowerCase()));
    const requiredSkills = (offer.requiredSkills || []).map(s => s.name.toLowerCase());
    
    if (candidateSkills.size > 0 && requiredSkills.length > 0) {
      // Calcular cuántas habilidades requeridas tiene el candidato
      const matchedSkills = requiredSkills.filter(skill => candidateSkills.has(skill)).length;
      const skillScore = requiredSkills.length > 0 ? matchedSkills / requiredSkills.length : 0;
      
      // El match de skills es muy importante, le damos peso 0.6
      score += skillScore * 0.6;
      this.logger.debug(`Offer ${offer.id}: Skill score ${skillScore.toFixed(2)} (${matchedSkills}/${requiredSkills.length})`);
    }
    
    // 2. Coincidencia de ubicación (peso 0.2)
    if (candidate.city && offer.company?.city) {
      const locationScore = candidate.city.toLowerCase() === offer.company.city.toLowerCase() ? 0.2 : 0.1;
      score += locationScore;
      this.logger.debug(`Offer ${offer.id}: Location score ${locationScore}`);
    }
    
    // 3. Coincidencia de salario (peso 0.2)
    if (candidate.expectedSalary && offer.salaryMax) {
      // Si el salario esperado está dentro del rango de la oferta
      const salaryScore = candidate.expectedSalary <= offer.salaryMax ? 0.2 : 
                         (offer.salaryMax >= candidate.expectedSalary * 0.8 ? 0.1 : 0);
      score += salaryScore;
      this.logger.debug(`Offer ${offer.id}: Salary score ${salaryScore}`);
    }
    
    return score;
  }

  private createRecommendationDTO(
    offer: any,
    candidate: any,
    score: number,
    scoreDetails?: { mlScore: number, heuristicScore: number }
  ): RecommendationDTO {
    // Asegurar que score sea un número válido
    if (score === null || score === undefined || isNaN(score)) {
      this.logger.warn(`Score inválido para oferta ${offer.id}, usando valor predeterminado 0.5`);
      score = 0.5;
    }
    
    // Calcular coincidencia de habilidades para mostrar en la UI
    const candidateSkillsSet = new Set((candidate.skills || []).map(s => s.name.toLowerCase()));
    const requiredSkills = (offer.requiredSkills || []).map(s => s.name.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => candidateSkillsSet.has(skill)).length;
    const skillsMatchPercentage = requiredSkills.length > 0 ? 
      Math.round((matchedSkills / requiredSkills.length) * 100) : 0;
    
    return {
      offerId: offer.id,
      title: offer.title || 'Sin título',
      company: offer.company?.user?.name || 'Empresa desconocida',
      matchScore: parseFloat(score.toFixed(2)),
      requiredSkills: (offer.requiredSkills || []).map(s => s.name),
      candidateSkills: (candidate.skills || []).map(s => s.name),
      salaryRange: `${offer.salaryMin || 0} - ${offer.salaryMax || 0} ${offer.currency || ''}`,
      locationMatch:
        (offer.company?.city && candidate.city && 
          offer.company.city.toLowerCase() === candidate.city.toLowerCase()) ? 'Exacta' : 'Parcial',
      contractTypes: (offer.contractTypes || []).map(c => c.name),
      modality: (offer.modality || []).map(m => m.name),
      skillsMatchPercentage,
      scoreDetails: {
        mlScore: scoreDetails?.mlScore !== null && scoreDetails?.mlScore !== undefined && !isNaN(scoreDetails?.mlScore) 
          ? scoreDetails.mlScore 
          : 0.5,
        heuristicScore: scoreDetails?.heuristicScore || 0
      }
    };
  }
}
