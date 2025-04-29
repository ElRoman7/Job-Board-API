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
      // Candidate: skills + location + salary + contract
      // Offer: skills + location + salary + contract
      const inputSize = this.NUM_SKILLS + 2 + 4 + (this.NUM_SKILLS + 2 + 4);
      this.logger.log(`Initializing model with input shape [${inputSize}]`);

      this.model.add(
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          inputShape: [inputSize],
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
      );

      this.model.add(tf.layers.dropout({ rate: 0.3 }));
      this.model.add(
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
      );

      // Capa de salida (clasificación binaria)
      this.model.add(
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
      );

      this.model.compile({
        optimizer: tf.train.adam(0.0005), // Reduced learning rate
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      try {
        await this.loadModelWeights();
      } catch (error) {
        this.logger.warn(
          'No se pudieron cargar pesos pre-entrenados, usando inicialización aleatoria',
        );
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
      
      const history = await this.model.fit(features, labels, {
        epochs,
        batchSize: 32, // Reduced batch size
        validationSplit: 0.2,
        callbacks: [
          tf.callbacks.earlyStopping({
            patience: 5,
            minDelta: 0.01,
          }),
        ],
      });

      this.logger.log(
        `Precisión final en entrenamiento: ${history.history['acc'].at(-1)}`,
      );
      this.logger.log(
        `Precisión final en validación: ${history.history['val_acc'].at(-1)}`,
      );


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

        // Ensure consistent feature structure
        const candidateFeatures = [
          ...candidateData.skillsTensor,
          candidateData.locationTensor,
          candidateData.salaryTensor,
          0,
          0,
          0,
          0, // Contract tensor placeholders for candidate
        ];

        const combinedFeatures = [
          ...candidateFeatures,
          ...offerData.skillsTensor,
          offerData.locationTensor,
          offerData.salaryTensor,
          ...offerData.contractTensor,
        ];

        featuresArray.push(combinedFeatures);
        labelsArray.push([application.status === 'accepted' ? 1 : 0]);
      } catch (error) {
        this.logger.warn(
          `Error procesando aplicación ${application.id}: ${error.message}`,
        );
      }
    }

    if (featuresArray.length === 0) {
      const inputSize = this.NUM_SKILLS + 2 + 4 + (this.NUM_SKILLS + 2 + 4);
      return {
        features: tf.tensor2d([], [0, inputSize]),
        labels: tf.tensor2d([], [0, 1]),
      };
    }

    return {
      features: tf.tensor2d(featuresArray),
      labels: tf.tensor2d(labelsArray),
    };
  }

  async calculateOfferMatch(offer: Offer, candidateEmbedding: number[]): Promise<number> {
    if (!this.isModelReady) {
      this.logger.warn('Model not ready, initializing...');
      await this.initializeModel();
    }

    try {
      const offerData = this.dataPreprocessor.preprocessOffer(offer);
      this.logger.debug(`Processed offer data for offer ${offer.id}`);

      // Combine candidate embedding with offer data
      const inputFeatures = [
        ...candidateEmbedding, // Candidate skills + location + salary + contract
        ...offerData.skillsTensor, // Offer skills
        offerData.locationTensor, // Offer location
        offerData.salaryTensor, // Offer salary
        ...offerData.contractTensor, // Offer contract types
      ];

      this.logger.debug(`Input features length: ${inputFeatures.length}`);

      const input = tf.tensor2d([inputFeatures]);
      const prediction = this.model.predict(input) as tf.Tensor;
      const score = prediction.dataSync()[0];

      this.logger.debug(`Calculated score for offer ${offer.id}: ${score}`);

      tf.dispose([input, prediction]);
      return score;
    } catch (error) {
      this.logger.error(
        `Error calculating match of offer ${offer.id}: ${error.message}`,
      );
      this.logger.error(error.stack);
      return 0.5; // Valor neutro
    }
  }

  async generateRecommendationEmbedding(candidate: Candidate): Promise<number[]> {
    if (!this.isModelReady) {
      this.logger.warn('Model not ready, initializing...');
      await this.initializeModel();
    }

    try {
      const candidateData =
        this.dataPreprocessor.preprocessCandidate(candidate);
      this.logger.debug(
        `Processed candidate data for candidate ${candidate.id}`,
      );

      // Ensure we return the same structure as expected in calculateOfferMatch
      const embedding = [
        ...candidateData.skillsTensor,
        candidateData.locationTensor,
        candidateData.salaryTensor,
        0,
        0,
        0,
        0, // Contract tensor placeholders for candidate
      ];

      this.logger.debug(`Generated embedding length: ${embedding.length}`);
      return embedding;
    } catch (error) {
      this.logger.error(
        `Error generating embedding for candidate ${candidate.id}: ${error.message}`,
      );
      this.logger.error(error.stack);
      // Return zero vector as fallback with correct size
      return Array(this.NUM_SKILLS + 2 + 4).fill(0); // skills + location + salary + contract
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
