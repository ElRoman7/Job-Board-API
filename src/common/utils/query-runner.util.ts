import { DataSource, QueryRunner } from 'typeorm';

export async function executeWithTransaction<T>(
  dataSource: DataSource,
  action: (queryRunner: QueryRunner) => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await action(queryRunner);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error; // Rethrow the error for the caller to handle
  } finally {
    await queryRunner.release();
  }
}
