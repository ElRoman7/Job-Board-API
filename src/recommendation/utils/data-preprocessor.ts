import { Injectable } from '@nestjs/common';
import { Candidate } from '../../candidate-details/entities/candidate.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { Skill } from '../../skills/entities/skill.entity';

@Injectable()
export class DataPreprocessor {
  private skillsMap: Map<string, number>;
  private locationMap: Map<string, number>;

  constructor(skills: Skill[]) {
    // Create skill to index mapping
    this.skillsMap = new Map();
    skills.forEach((skill, index) => {
      this.skillsMap.set(skill.name.toLowerCase(), index);
    });
    
    this.locationMap = new Map();
  }

  preprocessCandidate(candidate: Candidate) {
    // Initialize skills vector with zeros
    const skillsVector = Array(this.skillsMap.size).fill(0);
    
    // Set 1 for each skill the candidate has
    if (candidate.skills && candidate.skills.length > 0) {
      candidate.skills.forEach(skill => {
        const skillIndex = this.skillsMap.get(skill.name.toLowerCase());
        if (skillIndex !== undefined) {
          skillsVector[skillIndex] = 1;
        }
      });
    }

    // Normalize expected salary (0-1 range)
    const salaryTensor = candidate.expectedSalary ? 
      this.normalizeSalary(candidate.expectedSalary) : 0;
    
    // Location encoding (one-hot or embedding index)
    let locationTensor = 0;
    if (candidate.city) {
      const locationLower = candidate.city.toLowerCase();
      if (!this.locationMap.has(locationLower)) {
        this.locationMap.set(locationLower, this.locationMap.size);
      }
      locationTensor = this.locationMap.get(locationLower);
    }
    
    return {
      skillsTensor: skillsVector,
      locationTensor,
      salaryTensor
    };
  }

  preprocessOffer(offer: Offer) {
    // Initialize skills vector with zeros
    const skillsVector = Array(this.skillsMap.size).fill(0);
    
    // Set 1 for each required skill
    if (offer.requiredSkills && offer.requiredSkills.length > 0) {
      offer.requiredSkills.forEach(skill => {
        const skillIndex = this.skillsMap.get(skill.name.toLowerCase());
        if (skillIndex !== undefined) {
          skillsVector[skillIndex] = 1;
        }
      });
    }

    // Normalize salary range
    const salaryTensor = offer.salaryMax ? 
      this.normalizeSalary(offer.salaryMax) : 0;
    
    // Location encoding
    let locationTensor = 0;
    if (offer.company?.city) {
      const locationLower = offer.company.city.toLowerCase();
      if (!this.locationMap.has(locationLower)) {
        this.locationMap.set(locationLower, this.locationMap.size);
      }
      locationTensor = this.locationMap.get(locationLower);
    }
    
    // Contract type encoding (simplified to 4 dimensions)
    const contractTensor = [0, 0, 0, 0]; // Default values
    if (offer.contractTypes && offer.contractTypes.length > 0) {
      // Set based on contract type (simplified representation)
      offer.contractTypes.forEach((contract, idx) => {
        if (idx < 4) contractTensor[idx] = 1;
      });
    }
    
    return {
      skillsTensor: skillsVector,
      locationTensor,
      salaryTensor,
      contractTensor
    };
  }

  private normalizeSalary(salary: number): number {
    // Simple normalization (assuming salaries between 0-200,000)
    return Math.min(Math.max(salary / 200000, 0), 1);
  }
  
  getSkillsSize(): number {
    return this.skillsMap.size;
  }
}
