import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TaskManagement (e2e)', () => {
  let app: INestApplication;
  let createdTaskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Enable validation for tests
    await app.init();
  });

  afterAll(async () => {
    // Ideally we would clean up the DB here
    if (createdTaskId) {
      // Optional: Manual cleanup if using real DB
      // const service = app.get(TaskManagementService);
      // await service.remove(createdTaskId).catch(() => {});
    }
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('should create a task with valid data', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'E2E Task', description: 'Test desc', status: 'OPEN' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.title).toBe('E2E Task');
          createdTaskId = res.body._id;
        });
    });

    it('should fail with 400 if title is missing', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({ description: 'Missing title' })
        .expect(400); // Bad Request from ValidationPipe
    });
  });

  describe('/tasks (GET)', () => {
    it('should return all tasks', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/tasks/:id (GET)', () => {
    it('should return the created task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdTaskId);
          expect(res.body.title).toBe('E2E Task');
        });
    });

    it('should return 404 for non-existent ID', () => {
      const fakeId = '507f1f77bcf86cd799439011'; // A valid looking but non-existent Mongo ID
      return request(app.getHttpServer()).get(`/tasks/${fakeId}`).expect(404);
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer()).get('/tasks/invalid-id').expect(400);
    });
  });

  describe('/tasks/:id (PATCH)', () => {
    it('should update the task', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('IN_PROGRESS');
        });
    });

    it('should return 404 when updating non-existent task', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .patch(`/tasks/${fakeId}`)
        .send({ status: 'DONE' })
        .expect(404);
    });

    it('should return 400 when updating with invalid ID', () => {
      return request(app.getHttpServer())
        .patch('/tasks/invalid-id')
        .send({ status: 'DONE' })
        .expect(400);
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    it('should delete the task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(200);
    });

    it('should return 400 when deleting with invalid ID', () => {
      return request(app.getHttpServer())
        .delete('/tasks/invalid-id')
        .expect(400);
    });

    it('should return 404 when getting the deleted task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(404);
    });
  });
});
