export class RecommendationDTO {
  offerId: string;
  title: string;
  company: string;
  matchScore: number;
  requiredSkills: string[];
  candidateSkills: string[];
  salaryRange: string;
  locationMatch: string;
  contractTypes: string[];
  modality: string[];
  skillsMatchPercentage: number;
  scoreDetails?: {
    mlScore: number;
    heuristicScore: number;
  };
}
