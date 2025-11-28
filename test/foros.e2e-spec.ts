import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Foros (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates forum, thread and post', async () => {
    // Create a forum and user for testing
    const forum = await prismaService.foro.create({
      data: {
        slug: 'test-forum-' + Date.now(),
        nombre: 'Test Forum',
        descripcion: 'Test Description',
      },
    });

    const user = await prismaService.usuarios.create({
      data: {
        id: 'test-user-' + Date.now(),
        email: 'test-' + Date.now() + '@local.test',
        nombre: 'Test',
        apellido: 'User',
        estado_id: 1,
        rol_id: 1,
      },
    });

    try {
      // Create thread via endpoint
      const threadRes = await request(app.getHttpServer())
        .post(`/forums/${forum.slug}/threads`)
        .send({ title: 'Hola', slug: 'hola-' + Date.now(), content: 'Primer mensaje', authorId: user.id })
        .expect(201);

      const thread = threadRes.body;
      expect(thread).toBeDefined();
      expect(thread.id).toBeDefined();

      // Create a post via endpoint
      const postRes = await request(app.getHttpServer())
        .post(`/threads/${thread.id}/posts`)
        .send({ content: 'Respuesta', authorId: user.id })
        .expect(201);

      const post = postRes.body;
      expect(post).toBeDefined();
      expect(post.content).toBe('Respuesta');
    } finally {
      // Cleanup
      await prismaService.post.deleteMany({ where: { authorId: user.id } });
      await prismaService.hilo.deleteMany({ where: { forumId: forum.id } });
      await prismaService.foro.delete({ where: { id: forum.id } });
      await prismaService.usuarios.delete({ where: { id: user.id } });
    }
  }, 20000);
});
