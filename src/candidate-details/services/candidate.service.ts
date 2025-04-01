import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { MailService } from 'src/mail/mail.service';
import { Candidate } from '../entities/candidate.entity';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { UpdateCandidateDto } from '../dto/update-candidate.dto';
import { SkillsService } from 'src/skills/skills.service';
import { AddSkillDto } from '../dto/add-skill.dto';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly errrorHandlerService: ErrorHandlerService,
    private readonly mailService: MailService,
    private readonly skillsService: SkillsService,
  ) {}

  async create(
    createCandidateDto: CreateCandidateDto,
    createUserDto: CreateUserDto,
  ): Promise<Candidate> {
    return await executeWithTransaction(
      this.dataSource,
      async (queryRunner) => {
        try {
          const user =
            await this.usersService.prepareUserForTransaction(createUserDto);
          user.roles = [ValidRoles.candidate];
          await queryRunner.manager.save(user);

          const candidate = await this.prepareCandidateForTransaction(
            createCandidateDto,
            user,
          );
          await queryRunner.manager.save(candidate);
          // Maneja el envío del correo de confirmación
          // try {
          //   await this.mailService.sendUserConfirmation(user); // Usa await para esperar a que el correo se envíe
          // } catch (e) {
          //   throw new Error(
          //     `User creation failed: Unable to send confirmation email ${e}`,
          //   );
          // }

          return candidate;
        } catch (error) {
          this.errrorHandlerService.handleDBException(error);
        }
      },
    );
  }

  async findAll() {
    return await this.candidateRepository.find({
      relations: {
        user: true,
        cv: true,
      },
    });
  }

  async findOneByUserId(user_id: string) {
    return await this.candidateRepository.findOne({
      where: { user_id },
      relations: {
        user: true,
        cv: true,
        skills: true,
        applications: {
          offer: {
            company: {
              user: true,
            },
          },
        },
      },
    });
  }

  async prepareCandidateForTransaction(
    createCandidateDto: CreateCandidateDto,
    user: User,
  ) {
    const candidate = await this.candidateRepository.create({
      ...createCandidateDto,
      user: user,
    });
    return candidate;
  }

  async update(id: string, updateCandidateDto: CreateCandidateDto) {
    const candidate = await this.candidateRepository.findOneBy({ id });
    if (!candidate) {
      throw new BadRequestException('User not found');
    }
    await this.candidateRepository.update(id, updateCandidateDto);
    // await this.candidateRepository.save(candidate);
    return {
      message: 'Candidate updated successfully',
    };
  }

  async updateByUserId(
    user_id: string,
    updateCandidateDto: UpdateCandidateDto,
  ) {
    const candidate = await this.candidateRepository.findOneBy({
      user_id: user_id,
    });
    if (!candidate) {
      throw new BadRequestException('User not found');
    }
    await this.candidateRepository.update(candidate.id, updateCandidateDto);
    // await this.candidateRepository.save(candidate);
    return {
      message: 'Candidate updated successfully',
    };
  }

  async updateCvUrl(url: string, id: string) {
    await this.updateByUserId(id, { cvUrl: url });
    return {
      message: 'CV updated successfully',
    };
  }

  async save(candidate: Candidate): Promise<Candidate> {
    return await this.candidateRepository.save(candidate);
  }

  async addSkillToCandidate(addSkillDto: AddSkillDto, user: User) {
    try {
      const candidate = await this.findOneByUserId(user.id);
      if (!candidate) throw new NotFoundException('Candidate Not Found');

      // Obtener o crear las nuevas skills
      const newSkills = await this.skillsService.findOrCreate(
        addSkillDto.skill,
      );

      // Inicializar el array de skills si no existe
      if (!candidate.skills) {
        candidate.skills = [];
      }

      // Filtrar las skills que ya existen para no duplicarlas
      const skillsToAdd = newSkills.filter(
        (newSkill) =>
          !candidate.skills.some(
            (existingSkill) => existingSkill.id === newSkill.id,
          ),
      );

      // Añadir solo las skills que no existían previamente
      candidate.skills = [...candidate.skills, ...skillsToAdd];
      await this.save(candidate);

      return {
        message: 'Skills added successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errrorHandlerService.handleDBException(error);
    }
  }

  async removeSkillFromCandidate(skillId: string, user: User) {
    try {
      const candidate = await this.findOneByUserId(user.id);
      if (!candidate) throw new NotFoundException('Candidate Not Found');

      const skill = await this.skillsService.findById(skillId);
      if (!skill) throw new NotFoundException('Skill Not Found');

      // Filter out the skill to be removed
      if (candidate.skills) {
        candidate.skills = candidate.skills.filter(s => s.id !== skillId);
        await this.save(candidate);
      }
      
      return {
        message: 'Skill removed successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errrorHandlerService.handleDBException(error);
    }
  }

  // Skills

  // async updateProfileImageUrl(url: string, id: string){
  //   await this.usersRepository.update(id, {profileImageUrl: url});
  //   return {
  //     message: 'Profile image updated successfully'
  //   }
  // }
}
