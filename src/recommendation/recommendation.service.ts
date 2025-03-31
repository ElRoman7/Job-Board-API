import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobRecommenderModel } from './job-recommender.model';
import { SkillsService } from '../skills/skills.service';
import { CandidateService } from '../candidate-details/services/candidate.service';
import { RecommendationDTO } from './dto/recommendation.dto';
import { ApplicationsService } from '../job-applications/applications.service';
import { Offer } from 'src/offers/entities/offer.entity';

@Injectable()
export class RecommendationService implements OnModuleInit {
  private isModelInitialized = false;
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly recommenderModel: JobRecommenderModel,
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
    allOffers: Offer[],
  ): Promise<RecommendationDTO[]> {
    try {
      // Garantizar que topN sea al menos 3
      topN = Math.max(3, topN);

      this.logger.log(
        `Starting recommendation process for user ${userId}, requested ${topN} recommendations. Total offers: ${allOffers.length}`,
      );

      if (!this.isModelInitialized) {
        this.logger.log('Model not initialized, initializing now...');
        await this.initializeModel();
      }

      const candidate = await this.candidatesService.findOneByUserId(userId);
      if (!candidate) {
        this.logger.warn(
          `No se encontró candidato con userId ${userId}, returning random recommendations`,
        );
        const randomRecommendations = allOffers
          .slice(0, topN)
          .map((offer) =>
            this.createRecommendationDTO(offer, { skills: [] }, 0.5),
          );
        this.logger.log(
          `Returning ${randomRecommendations.length} random recommendations due to no candidate found`,
        );
        return randomRecommendations;
      }

      this.logger.log(
        `Found candidate for userId ${userId}, proceeding with recommendations`,
      );

      // Get application history
      const applicationHistory =
        await this.applicationsService.getApplicationHistory(candidate.id);
      const appliedOfferIds = new Set(
        applicationHistory.map((app) => app.offer.id),
      );

      this.logger.log(
        `User has applied to ${appliedOfferIds.size} offers out of ${allOffers.length} available offers`,
      );

      // Check how many offers would remain after filtering
      const availableOffers = allOffers.filter(
        (offer) => !appliedOfferIds.has(offer.id),
      );
      this.logger.log(
        `After filtering applied offers: ${availableOffers.length} offers remain available`,
      );

      // If too few offers would remain, use all offers with a preference for non-applied offers
      let offersToProcess;
      if (availableOffers.length < Math.max(topN, 3)) {
        this.logger.log(
          `Too few offers after filtering (${availableOffers.length}), including previously applied offers`,
        );
        offersToProcess = allOffers; // Use all offers, including applied ones
      } else {
        offersToProcess = availableOffers;
      }

      // Get candidate skills embedding
      let candidateSkillsEmbedding;
      try {
        candidateSkillsEmbedding =
          await this.recommenderModel.generateRecommendationEmbedding(
            candidate,
          );
      } catch (error) {
        this.logger.error(
          `Error generating candidate embedding: ${error.message}, using fallback scoring`,
        );
        candidateSkillsEmbedding = null;
      }

      // Calculate scores for each offer
      const recommendations = [];
      this.logger.log(
        `Processing ${offersToProcess.length} offers for scoring`,
      );

      for (const offer of offersToProcess) {
        // Apply a slight penalty for already applied offers
        const alreadyApplied = appliedOfferIds.has(offer.id);

        // Calculate ML score (or use default)
        let mlScore = 0.5; // Default score
        if (candidateSkillsEmbedding) {
          try {
            mlScore = await this.recommenderModel.calculateOfferMatch(
              offer,
              candidateSkillsEmbedding,
            );
            if (mlScore === null || mlScore === undefined || isNaN(mlScore)) {
              mlScore = 0.5;
            }
          } catch (error) {
            this.logger.warn(
              `Failed to calculate ML score for offer ${offer.id}: ${error.message}`,
            );
          }
        }

        // Calculate heuristic score
        const heuristicScore = this.calculateHeuristicScore(offer, candidate);

        // Combine scores - apply penalty for already applied offers
        let combinedScore = mlScore * 0.5 + heuristicScore * 0.5;
        if (alreadyApplied) {
          combinedScore *= 0.7; // 30% penalty for already applied offers
        }

        recommendations.push(
          this.createRecommendationDTO(offer, candidate, combinedScore, {
            mlScore,
            heuristicScore,
          }),
        );
      }

      this.logger.log(
        `Generated ${recommendations.length} recommendations for userId ${userId} before sorting/limiting`,
      );

      if (recommendations.length === 0) {
        this.logger.warn(
          'No recommendations generated! Using fallback to random offers',
        );
        // Emergency fallback - just return random offers
        return allOffers
          .sort(() => Math.random() - 0.5)
          .slice(0, topN)
          .map((offer) => this.createRecommendationDTO(offer, candidate, 0.5));
      }

      // Sort recommendations by score
      const sortedRecommendations = recommendations.sort(
        (a, b) => b.matchScore - a.matchScore,
      );

      const result = sortedRecommendations.slice(0, topN);
      this.logger.log(
        `Returning ${result.length} final recommendations for user ${userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error in recommendation process: ${error.message}`);
      this.logger.error(error.stack);
      // Fallback to random recommendations
      const randomRecommendations = allOffers
        .slice(0, topN)
        .map((offer) =>
          this.createRecommendationDTO(offer, { skills: [] }, 0.5),
        );
      this.logger.log(
        `Returning ${randomRecommendations.length} random recommendations due to error`,
      );
      return randomRecommendations;
    }
  }

  /**
   * Calcula un score basado en heurísticas directamente interpretables
   */
  private calculateHeuristicScore(offer: any, candidate: any): number {
    let score = 0;

    // 1. Coincidencia de habilidades (factor más importante)
    const candidateSkills = new Set(
      (candidate.skills || []).map((s) => s.name.toLowerCase()),
    );
    const requiredSkills = (offer.requiredSkills || []).map((s) =>
      s.name.toLowerCase(),
    );

    if (candidateSkills.size > 0 && requiredSkills.length > 0) {
      // Calcular cuántas habilidades requeridas tiene el candidato
      const matchedSkills = requiredSkills.filter((skill) =>
        candidateSkills.has(skill),
      ).length;
      const skillScore =
        requiredSkills.length > 0 ? matchedSkills / requiredSkills.length : 0;

      // El match de skills es muy importante, le damos peso 0.6
      score += skillScore * 0.6;
      this.logger.debug(
        `Offer ${offer.id}: Skill score ${skillScore.toFixed(2)} (${matchedSkills}/${requiredSkills.length})`,
      );
    }

    // 2. Coincidencia de ubicación (peso 0.2)
    if (candidate.city && offer.company?.city) {
      const locationScore =
        candidate.city.toLowerCase() === offer.company.city.toLowerCase()
          ? 0.2
          : 0.1;
      score += locationScore;
      this.logger.debug(`Offer ${offer.id}: Location score ${locationScore}`);
    }

    // 3. Coincidencia de salario (peso 0.2)
    if (candidate.expectedSalary && offer.salaryMax) {
      // Si el salario esperado está dentro del rango de la oferta
      const salaryScore =
        candidate.expectedSalary <= offer.salaryMax
          ? 0.2
          : offer.salaryMax >= candidate.expectedSalary * 0.8
            ? 0.1
            : 0;
      score += salaryScore;
      this.logger.debug(`Offer ${offer.id}: Salary score ${salaryScore}`);
    }

    return score;
  }

  private createRecommendationDTO(
    offer: any,
    candidate: any,
    score: number,
    scoreDetails?: { mlScore: number; heuristicScore: number },
  ): RecommendationDTO {
    // Asegurar que score sea un número válido
    if (score === null || score === undefined || isNaN(score)) {
      this.logger.warn(
        `Score inválido para oferta ${offer.id}, usando valor predeterminado 0.5`,
      );
      score = 0.5;
    }

    // Calcular coincidencia de habilidades para mostrar en la UI
    const candidateSkillsSet = new Set(
      (candidate.skills || []).map((s) => s.name.toLowerCase()),
    );
    const requiredSkills = (offer.requiredSkills || []).map((s) =>
      s.name.toLowerCase(),
    );
    const matchedSkills = requiredSkills.filter((skill) =>
      candidateSkillsSet.has(skill),
    ).length;
    const skillsMatchPercentage =
      requiredSkills.length > 0
        ? Math.round((matchedSkills / requiredSkills.length) * 100)
        : 0;

    return {
      offerId: offer.id,
      title: offer.title || 'Sin título',
      company: offer.company?.user?.name || 'Empresa desconocida',
      matchScore: parseFloat(score.toFixed(2)),
      requiredSkills: (offer.requiredSkills || []).map((s) => s.name),
      candidateSkills: (candidate.skills || []).map((s) => s.name),
      salaryRange: `${offer.salaryMin || 0} - ${offer.salaryMax || 0} ${offer.currency || ''}`,
      locationMatch:
        offer.company?.city &&
        candidate.city &&
        offer.company.city.toLowerCase() === candidate.city.toLowerCase()
          ? 'Exacta'
          : 'Parcial',
      contractTypes: (offer.contractTypes || []).map((c) => c.name),
      modality: (offer.modality || []).map((m) => m.name),
      skillsMatchPercentage,
      scoreDetails: {
        mlScore:
          scoreDetails?.mlScore !== null &&
          scoreDetails?.mlScore !== undefined &&
          !isNaN(scoreDetails?.mlScore)
            ? scoreDetails.mlScore
            : 0.5,
        heuristicScore: scoreDetails?.heuristicScore || 0,
      },
    };
  }
}
