import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from './../src/app.module';

describe('Votes e2e', () => {
  let app: INestApplication;
  let socket: Socket;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // listen on random port so socket.io attaches to server
    const server = await app.listen(0);
    const address: any = server.address();
    const port = typeof address === 'string' ? 4000 : address.port;
    baseUrl = `http://localhost:${port}`;

    // connect socket.io client
    socket = io(baseUrl, { reconnectionDelay: 0, timeout: 2000 });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Socket connect timeout')), 3000);
      socket.on('connect', () => {
        clearTimeout(t);
        resolve();
      });
      socket.on('connect_error', (err) => reject(err));
    });
  }, 20000);

  afterAll(async () => {
    if (socket && socket.connected) socket.close();
    await app.close();
  });

  it('create response -> vote -> emits event and is idempotent', async () => {
    // create response
    await request(baseUrl).post('/responses').send({ id: 'e2e-r1', content: 'e2e' }).expect(201);

    // listen for event
    let emitted: any = null;
    socket.on('response:vote', (p) => (emitted = p));

    // first vote
    const res1 = await request(baseUrl)
      .post('/responses/e2e-r1/vote')
      .set('x-user-id', 'user-a')
      .send({ vote: 'useful' })
      .expect(200);

    expect(res1.body.counts.useful).toBe(1);
    // wait a moment for event
    await new Promise((r) => setTimeout(r, 200));
    expect(emitted).not.toBeNull();
    expect(emitted.responseId).toBe('e2e-r1');

    // idempotent
    const res2 = await request(baseUrl)
      .post('/responses/e2e-r1/vote')
      .set('x-user-id', 'user-a')
      .send({ vote: 'useful' })
      .expect(200);
    expect(res2.body.message).toMatch(/idempotente|Sin cambio|no change/i);

    // change vote
    const res3 = await request(baseUrl)
      .post('/responses/e2e-r1/vote')
      .set('x-user-id', 'user-a')
      .send({ vote: 'not_useful' })
      .expect(200);
    expect(res3.body.counts.useful).toBe(0);
    expect(res3.body.counts.notUseful).toBe(1);
  }, 20000);

  it('rejects when x-user-id missing', async () => {
    await request(baseUrl).post('/responses/e2e-r1/vote').send({ vote: 'useful' }).expect(400);
  });
});
