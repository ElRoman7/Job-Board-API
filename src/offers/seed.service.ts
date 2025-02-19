import { Injectable, OnModuleInit } from '@nestjs/common';
import { AdditionalBenefit, ContractType, ExperienceLevel, ModalityType, WorkArea } from './entities/tags.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService implements OnModuleInit{
    constructor(
        @InjectRepository(ModalityType) 
        private readonly modalityTypeRepository: Repository<ModalityType>,
        @InjectRepository(ContractType)
        private readonly contractTypeRepository: Repository<ContractType>,
        @InjectRepository(ExperienceLevel)
        private readonly experienceLevelRepository: Repository<ExperienceLevel>,
        @InjectRepository(WorkArea)
        private readonly workAreaRepository: Repository<WorkArea>,
        @InjectRepository(AdditionalBenefit)
        private readonly additionalBenefitRepository: Repository<AdditionalBenefit>
    ) {}

   async onModuleInit() {
        await this.seed();
    }

    async seed() {
        await this.modalityTypeRepository.save([
            { name: 'Remoto' }, 
            { name: 'Presencial' }, 
            { name: 'Híbrido' },
            { name: 'Por Proyecto' },
            { name: 'Flexible' }
        ]);

        await this.contractTypeRepository.save([
            { name: 'Tiempo Completo' },
            { name: 'Medio Tiempo' },
            { name: 'Freelance' },
            { name: 'Prácticas / Internship' },
            { name: 'Contrato Temporal' },
            { name: 'Por Honorarios' },
            { name: 'Voluntariado' },
            { name: 'Consultoría' }
        ]);

        await this.experienceLevelRepository.save([
            { name: 'Trainee' },
            { name: 'Junior' },
            { name: 'Semi-Senior' },
            { name: 'Senior' },
            { name: 'Experto' },
            { name: 'Director' },
            { name: 'Ejecutivo' }
        ]);

        await this.workAreaRepository.save([
            { name: 'Desarrollo de Software' },
            { name: 'Diseño y UX' },
            { name: 'Contenidos y Redacción' },
            { name: 'Finanzas y Contabilidad' },
            { name: 'Recursos Humanos' },
            { name: 'Tecnología' },
            { name: 'Salud' },
            { name: 'Educación' },
            { name: 'Marketing y Publicidad' },
            { name: 'Administración y Finanzas' },
            { name: 'Recursos Humanos' },
            { name: 'Ingeniería y Manufactura' },
            { name: 'Ventas y Comercio' },
            { name: 'Arte y Diseño' },
            { name: 'Legal' },
            { name: 'Consultoría' },
            { name: 'Turismo y Hospitalidad' },
            { name: 'Transporte y Logística' },
            { name: 'Construcción' },
            { name: 'Agricultura y Medio Ambiente' },
            { name: 'Energía y Minería' },
            { name: 'Moda y Retail' },
            { name: 'Ciencias y Laboratorios' },
            { name: 'Bienes Raíces' },
            { name: 'Deportes y Entretenimiento' },
            { name: 'Gastronomía y Restaurantes' },
            { name: 'Seguros y Banca' },
            { name: 'Telecomunicaciones' },
            { name: 'Gestión de Eventos' },
            { name: 'Aeronáutica y Espacial' }
        ]);

        await this.additionalBenefitRepository.save([
            { name: 'Horario Flexible' },
            { name: 'Trabajo en el Extranjero' },
            { name: 'Bonos por Desempeño' },
            { name: 'Seguro Médico' },
            { name: 'Capacitación y Cursos' },
            { name: 'Opción de Crecimiento' },
            { name: 'Home Office Equipado' },
            { name: 'Comida y Snacks Gratis' },
            { name: 'Vacaciones Adicionales' },
            { name: 'Descuentos en Productos o Servicios' },
            { name: 'Actividades de Integración' },
            { name: 'Seguro de Vida' },
            { name: 'Días Libres por Cumpleaños' },
            { name: 'Gimnasio o Membresía Deportiva' },
            { name: 'Subsidio para Transporte' },
            { name: 'Guardería o Apoyo para Cuidado Infantil' },
            { name: 'Stock Options' },
            { name: 'Transporte Corporativo' },
            { name: 'Apoyo Psicológico o Coaching' },
            { name: 'Estacionamiento Privado' },
            { name: 'Eventos y Viajes Corporativos' },
            { name: 'Ayuda para Vivienda' }
        ]);
    }
}
