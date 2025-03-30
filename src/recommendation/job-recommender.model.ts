import * as tf from '@tensorflow/tfjs-node';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataPreprocessor } from './utils/data-preprocessor';
import { Candidate } from '../candidate-details/entities/candidate.entity';
import { Offer } from '../offers/entities/offer.entity';
import { SkillsService } from '../skills/skills.service';
import { ApplicationsService } from '../job-applications/applications.service';

@Injectable()
export class JobRecommenderModel implements OnModuleInit {
  private model: tf.Sequential;
  private dataPreprocessor: DataPreprocessor;
  private logger = new Logger(JobRecommenderModel.name);
  private NUM_SKILLS: number;
  private readonly NUM_LOCATIONS: number = 1000; // Ajustar según necesidades
  private isModelReady = false;

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly skillsService: SkillsService,
  ) {}

  async onModuleInit() {
    // Initialize will be called explicitly to avoid circular dependencies
  }

  async initializeModel(): Promise<void> {
    try {
      const skills = await this.skillsService.findAll();
      this.dataPreprocessor = new DataPreprocessor(skills);
      this.NUM_SKILLS = skills.length;
      
      this.model = tf.sequential();

      // Define input shape consistently - this is critical
      const inputSize = this.NUM_SKILLS * 2 + 2 + 1 + 4; // Skills (candidato + oferta) + locations + salary + contract
      this.logger.log(`Initializing model with input shape [${inputSize}]`);
      
      this.model.add(
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [inputSize],
        }),
      );
      // Capas ocultas
      this.model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      this.model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

      // Capa de salida (clasificación binaria)
      this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      try {
        await this.loadModelWeights();
      } catch (error) {
        this.logger.warn('No se pudieron cargar pesos pre-entrenados, usando inicialización aleatoria');
      }

      this.isModelReady = true;
      this.logger.log('Modelo inicializado correctamente');
    } catch (error) {
      this.logger.error(`Error al inicializar el modelo: ${error.message}`);
      throw error;
    }
  }

  async trainModel(epochs = 20): Promise<void> {
    if (!this.isModelReady) {
      await this.initializeModel();
    }
    
    try {
      const { features, labels } = await this.prepareTrainingData();
      
      if (features.shape[0] === 0) {
        this.logger.warn('No hay datos de entrenamiento suficientes');
        return;
      }
      
      this.logger.log(`Entrenando con ${features.shape[0]} ejemplos, dimensiones: ${features.shape}`);
      
      await this.model.fit(features, labels, {
        epochs,
        batchSize: 64,
        validationSplit: 0.2,
        callbacks: [
          tf.callbacks.earlyStopping({ patience: 3 }),
        ]
      });

      await this.saveModelWeights();
      this.logger.log('Modelo entrenado exitosamente');
    } catch (error) {
      this.logger.error(`Error entrenando el modelo: ${error.message}`);
      throw error;
    }
  }

  private async prepareTrainingData(): Promise<{
    features: tf.Tensor2D;
    labels: tf.Tensor2D;
  }> {
    const applications = await this.applicationsService.findWithRelations();
    this.logger.log(`Preparando datos: ${applications.length} aplicaciones`);

    const featuresArray = [];
    const labelsArray = [];

    for (const application of applications) {
      try {
        const candidateData = this.dataPreprocessor.preprocessCandidate(
          application.candidate,
        );
        const offerData = this.dataPreprocessor.preprocessOffer(
          application.offer,
        );

        const combinedFeatures = [
          ...candidateData.skillsTensor,
          ...offerData.skillsTensor,
          candidateData.locationTensor,
          offerData.locationTensor,
          candidateData.salaryTensor,
          ...offerData.contractTensor,
        ];

        featuresArray.push(combinedFeatures);
        labelsArray.push([application.status === 'accepted' ? 1 : 0]);
      } catch (error) {
        this.logger.warn(`Error procesando aplicación ${application.id}: ${error.message}`);
      }
    }

    if (featuresArray.length === 0) {
      return { 
        features: tf.tensor2d([], [0, this.NUM_SKILLS * 2 + 2 + 1 + 4]), 
        labels: tf.tensor2d([], [0, 1]) 
      };
    }

    return {
      features: tf.tensor2d(featuresArray),
      labels: tf.tensor2d(labelsArray),
    };
  }

  async calculateOfferMatch(offer: Offer, candidateEmbedding: number[]): Promise<number> {
    if (!this.isModelReady) {
      await this.initializeModel();
    }
    
    try {
      const offerData = this.dataPreprocessor.preprocessOffer(offer);
      
      // Combine candidate embedding with offer data
      const inputFeatures = [
        ...candidateEmbedding,                // Candidate skills
        ...offerData.skillsTensor,            // Offer skills
        candidateEmbedding[candidateEmbedding.length - 2], // Candidate location
        offerData.locationTensor,             // Offer location
        candidateEmbedding[candidateEmbedding.length - 1], // Candidate salary
        ...offerData.contractTensor,          // Contract types
      ];
      
      const input = tf.tensor2d([inputFeatures]);
      const prediction = this.model.predict(input) as tf.Tensor;
      const score = prediction.dataSync()[0];
      
      tf.dispose([input, prediction]);
      return score;
    } catch (error) {
      this.logger.error(`Error calculando match de oferta: ${error.message}`);
      return 0.5; // Valor neutro
    }
  }

  async generateRecommendationEmbedding(candidate: Candidate): Promise<number[]> {
    if (!this.isModelReady) {
      await this.initializeModel();
    }
    
    try {
      const candidateData = this.dataPreprocessor.preprocessCandidate(candidate);
      return [
        ...candidateData.skillsTensor,
        candidateData.locationTensor,
        candidateData.salaryTensor,
      ];
    } catch (error) {
      this.logger.error(`Error generando embedding de candidato: ${error.message}`);
      // Return zero vector as fallback
      return Array(this.NUM_SKILLS + 2).fill(0);
    }
  }

  private async saveModelWeights(): Promise<void> {
    try {
      await this.model.save('file://./model-weights');
      this.logger.log('Pesos del modelo guardados');
    } catch (error) {
      this.logger.error(`Error al guardar pesos del modelo: ${error.message}`);
    }
  }

  private async loadModelWeights(): Promise<void> {
    try {
      const loadedModel = await tf.loadLayersModel('file://./model-weights/model.json');
      this.model.setWeights(loadedModel.getWeights());
      this.logger.log('Pesos del modelo cargados exitosamente');
    } catch (error) {
      this.logger.warn('No se encontraron pesos pre-entrenados, usando inicialización aleatoria');
      throw error; // Propagar el error para manejar la inicialización aleatoria
    }
  }
}
