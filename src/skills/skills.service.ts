import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  async findOrCreate(skillNames: string[]): Promise<Skill[]> {
    const skills: Skill[] = [];

    for (const name of skillNames) {
      const normalizedName = name.toLowerCase().trim();
      let skill = await this.skillsRepository.findOne({
        where: { name: normalizedName },
      });

      if (!skill) {
        skill = this.skillsRepository.create({ name: normalizedName });
        await this.skillsRepository.save(skill);
      }

      skills.push(skill);
    }

    return skills;
  }

  async findById(id: string) {
    return this.skillsRepository.findOneBy({ id });
  }

  async findAll() {
    return await this.skillsRepository.find();
  }

  async getSkills() {
    return this.skillsRepository.find();
  }
}
