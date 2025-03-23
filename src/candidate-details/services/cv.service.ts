import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CvEntity } from '../entities/cv.entity';
import { User } from 'src/users/entities/user.entity';
import { CandidateService } from './candidate.service';
import { OpenAI } from 'openai';
import { SkillsService } from 'src/skills/skills.service';

@Injectable()
export class CvService {
  // Configuración mejorada de OpenAI para DeepSeek
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  });

  constructor(
    @InjectRepository(CvEntity)
    private cvRepository: Repository<CvEntity>,
    private readonly candidateService: CandidateService,
    private readonly skillsService: SkillsService,
  ) {}
  /**
   * Procesa un CV y extrae información estructurada usando IA
   * @param cvTexto Texto completo del CV
   * @param user Usuario autenticado
   * @returns CV procesado y guardado
   */
  async procesarCV(cvTexto: string, user: User): Promise<CvEntity> {
    if (!cvTexto || cvTexto.trim().length === 0) {
      throw new BadRequestException('El texto del CV es requerido');
    }

    const candidate = await this.candidateService.findOneByUserId(user.id);
    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado');
    }

    try {
      // Verificar si ya existe un CV para el candidato
      let cv = await this.cvRepository.findOne({
        where: { candidate: { id: candidate.id } },
      });

      // Procesar el CV con OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Extrae información en formato JSON estricto usando este esquema:
                    {
                        "nombre": string,
                        "email": string,
                        "telefono": string,
                        "experiencia": [{
                            "puesto": string, 
                            "empresa": string, 
                            "periodo": string
                        }],
                        "educacion": [{
                            "titulo": string, 
                            "institucion": string, 
                            "año": number
                        }],
                        "habilidades": string[]
                    }`,
          },
          { role: 'user', content: cvTexto.trim().replace(/\s+/g, ' ') },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const rawResponse = response.choices[0].message.content;
      //console.log('Respuesta cruda de la API:', rawResponse);
      const respuesta = JSON.parse(rawResponse);

      const requiredFields = ['nombre', 'email', 'experiencia', 'educacion'];
      requiredFields.forEach((field) => {
        if (!respuesta[field]) {
          throw new BadRequestException(`Campo requerido faltante: ${field}`);
        }
      });

      // Procesar y guardar skills
      if (respuesta.habilidades && Array.isArray(respuesta.habilidades)) {
        const skills = await this.skillsService.findOrCreate(
          respuesta.habilidades,
        );
        candidate.skills = skills;
        await this.candidateService.save(candidate);
      }

      // Si ya existe un CV, actualizarlo
      if (cv) {
        cv.nombre = respuesta.nombre || cv.nombre;
        cv.email = respuesta.email || cv.email;
        cv.telefono = respuesta.telefono || cv.telefono;
        cv.experiencia = JSON.stringify(respuesta.experiencia);
        cv.educacion = JSON.stringify(respuesta.educacion);
        cv.habilidades = JSON.stringify(respuesta.habilidades);
      } else {
        // Si no existe, crearlo
        cv = this.cvRepository.create({
          nombre: respuesta.nombre || '',
          email: respuesta.email || '',
          telefono: respuesta.telefono || '',
          experiencia: JSON.stringify(respuesta.experiencia),
          educacion: JSON.stringify(respuesta.educacion),
          habilidades: JSON.stringify(respuesta.habilidades),
          candidate: candidate,
        });
      }

      return await this.cvRepository.save(cv);
    } catch (error) {
      console.error('Detalle del error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw new BadRequestException(`Error procesando CV: ${error.message}`);
    }
  }
}
